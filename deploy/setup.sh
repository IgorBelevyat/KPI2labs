#!/bin/bash
set -e

APP_USER="app"
APP_DIR="/opt/mywebapp"
CONFIG_DIR="/etc/mywebapp"
REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "=== [1/8] Installing packages ==="
apt-get update
apt-get install -y postgresql nginx curl

if ! node -v 2>/dev/null | grep -q "v20"; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi

echo "=== [2/8] Creating users ==="
if ! id "student" &>/dev/null; then
    useradd -m -s /bin/bash student
    echo "student:12345678" | chpasswd
    chage -d 0 student
    usermod -aG sudo student
fi

if ! id "teacher" &>/dev/null; then
    useradd -m -s /bin/bash teacher
    echo "teacher:12345678" | chpasswd
    chage -d 0 teacher
    usermod -aG sudo teacher
fi

if ! id "$APP_USER" &>/dev/null; then
    useradd -r -s /usr/sbin/nologin "$APP_USER"
fi

if ! id "operator" &>/dev/null; then
    useradd -m -s /bin/bash operator
    echo "operator:12345678" | chpasswd
    chage -d 0 operator
fi

cat > /etc/sudoers.d/operator << 'EOF'
operator ALL=(ALL) NOPASSWD: /usr/bin/systemctl start mywebapp
operator ALL=(ALL) NOPASSWD: /usr/bin/systemctl stop mywebapp
operator ALL=(ALL) NOPASSWD: /usr/bin/systemctl restart mywebapp
operator ALL=(ALL) NOPASSWD: /usr/bin/systemctl status mywebapp
operator ALL=(ALL) NOPASSWD: /usr/bin/systemctl reload nginx
EOF
chmod 440 /etc/sudoers.d/operator

echo "=== [3/8] Creating database ==="
systemctl start postgresql
systemctl enable postgresql

sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='mywebapp'" | grep -q 1 || \
    sudo -u postgres psql -c "CREATE ROLE mywebapp WITH LOGIN PASSWORD 'mywebapp_password';"
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='ticket_booking'" | grep -q 1 || \
    sudo -u postgres psql -c "CREATE DATABASE ticket_booking OWNER mywebapp;"

echo "=== [4/8] Copying config files ==="
mkdir -p "$CONFIG_DIR"

cp "$REPO_DIR/deploy/config.json" "$CONFIG_DIR/config.json"
chmod 640 "$CONFIG_DIR/config.json"
chown root:$APP_USER "$CONFIG_DIR/config.json"

cat > "$CONFIG_DIR/env" << EOF
DATABASE_URL=postgresql://mywebapp:mywebapp_password@127.0.0.1:5432/ticket_booking?schema=public
JWT_ACCESS_SECRET=change-me-access-secret
JWT_REFRESH_SECRET=change-me-refresh-secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
PORT=8000
NODE_ENV=production
EOF
chmod 640 "$CONFIG_DIR/env"
chown root:$APP_USER "$CONFIG_DIR/env"

echo "=== [5/8] Installing application ==="
mkdir -p "$APP_DIR"
cp -r "$REPO_DIR"/{src,prisma,package.json,package-lock.json,tsconfig.json} "$APP_DIR/"
cd "$APP_DIR"

# Install ALL dependencies (including devDependencies like typescript) to build
npm ci
npx prisma generate
npm run build

# Remove devDependencies after build to save space
npm prune --omit=dev

# Run database migrations before changing ownership
# (needs DATABASE_URL from env file)
export $(cat "$CONFIG_DIR/env" | xargs)
npx prisma migrate deploy

chown -R $APP_USER:$APP_USER "$APP_DIR"

echo "=== [6/8] Setting up systemd service ==="
cp "$REPO_DIR/deploy/mywebapp.service" /etc/systemd/system/mywebapp.service
systemctl daemon-reload
systemctl enable mywebapp
systemctl start mywebapp

echo "=== [7/8] Configuring nginx ==="
# Ensure directories exist (some minimal installs don't have them)
mkdir -p /etc/nginx/sites-available /etc/nginx/sites-enabled

# Remove any leftover directory/file to avoid "cp into directory" issue
rm -rf /etc/nginx/sites-available/mywebapp
rm -rf /etc/nginx/sites-enabled/mywebapp

cp "$REPO_DIR/deploy/nginx.conf" /etc/nginx/sites-available/mywebapp
ln -sf /etc/nginx/sites-available/mywebapp /etc/nginx/sites-enabled/mywebapp

# Remove default config that intercepts traffic on port 80
rm -f /etc/nginx/sites-enabled/default

nginx -t && systemctl reload nginx

echo "=== [8/8] Creating gradebook ==="
echo "3" > /home/student/gradebook
chown student:student /home/student/gradebook

# Lock the default VM user (the one created during OS install)
DEFAULT_USER=$(awk -F: '$3 >= 1000 && $1 != "student" && $1 != "teacher" && $1 != "operator" {print $1}' /etc/passwd | head -1)
if [ -n "$DEFAULT_USER" ] && [ "$DEFAULT_USER" != "root" ]; then
    usermod -L "$DEFAULT_USER"
    echo "Locked default user: $DEFAULT_USER"
fi

echo ""
echo "=== Deployment complete! ==="
echo "App:    http://127.0.0.1:8000"
echo "Nginx:  http://<VM_IP>:80"
echo ""
echo "Verify:"
echo "  curl http://localhost/health/alive   → OK"
echo "  curl http://localhost/health/ready   → OK"
echo "  curl http://localhost/               → HTML page"
echo "  curl http://localhost/api/stations   → JSON"
echo ""
echo "Users created: student, teacher, app (system), operator"
echo "Default passwords: 12345678 (must change on first login)"
