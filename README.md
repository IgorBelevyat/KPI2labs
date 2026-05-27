# TicketBooking — система бронювання залізничних квитків

Система бронювання квитків на потяги, побудована на основі Layered Architecture (DDD) з Rich Domain Model.

## Технології

| Технологія | Реалізація |
|------------|-----------|
| Backend | Node.js, Express, TypeScript |
| Frontend | React, Vite, TypeScript |
| БД | PostgreSQL |
| ORM | Prisma |
| Авторизація | JWT (access + refresh tokens) |
| Хешування | bcrypt |
| IaC | Terraform (libvirt), Ansible |

## Структура проєкту

```
src/
├── domain/            # Бізнес-логіка (моделі, фабрики, інтерфейси репозиторіїв, помилки)
├── application/       # Оркестрація (Use Cases, DTO, інтерфейси для читання)
├── presentation/      # HTTP-шар (контролери, валідатори, middleware, роутінг)
└── infrastructure/    # Технічна реалізація (Prisma репозиторії, маперів, auth)

deploy/
├── terraform/         # IaC — створення ВМ через libvirt/KVM
│   ├── main.tf
│   ├── variables.tf
│   ├── outputs.tf
│   ├── cloud-init.yml
│   ├── network-config.yml
│   └── setup-host.sh
└── ansible/           # Configuration Management
    ├── playbook.yml
    ├── ansible.cfg
    ├── group_vars/
    └── roles/         # common, database, app, nginx
```

Детальний опис архітектури — у файлі `docs/analysis/lab2.md`.

---

## Налаштування середовища розробки

### Передумови

| Програма | Версія | Перевірка |
|----------|--------|-----------|
| Node.js | v18+ (рекомендовано v20 LTS) | `node -v` |
| npm | v9+ | `npm -v` |
| PostgreSQL | v14+ | `psql --version` |
| Git | будь-яка | `git --version` |

### 1. Клонування та залежності

```bash
git clone https://github.com/IgorBelevyat/KPI2labs.git
cd KPI2labs
npm install

cd frontend
npm install
cd ..
```

### 2. Налаштування `.env`

Створіть файл `.env` у кореневій директорії:

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/ticket_booking?schema=public"
JWT_ACCESS_SECRET="your-access-secret"
JWT_REFRESH_SECRET="your-refresh-secret"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"
PORT=8000
NODE_ENV=development
```

### 3. Підготовка БД

```bash
psql -U postgres -c "CREATE DATABASE ticket_booking;"
npx prisma generate
npx prisma migrate dev
npm run prisma:seed
```

### 4. Запуск (dev-режим)

**Backend (порт 8000):**
```bash
npm run dev
```

**Frontend (порт 5173):**
```bash
cd frontend
npm run dev
```

---

## API Endpoints

### Авторизація

| Метод | Шлях | Опис |
|-------|------|------|
| POST | `/api/auth/register` | Реєстрація |
| POST | `/api/auth/login` | Вхід |
| POST | `/api/auth/refresh` | Оновлення токена |

### Станції (admin)

| Метод | Шлях | Опис |
|-------|------|------|
| GET | `/api/stations` | Список станцій |
| POST | `/api/stations` | Створити станцію |
| PUT | `/api/stations/:id` | Оновити станцію |
| DELETE | `/api/stations/:id` | Видалити станцію |

### Маршрути (admin)

| Метод | Шлях | Опис |
|-------|------|------|
| GET | `/api/routes` | Список маршрутів |
| POST | `/api/routes` | Створити маршрут |
| PUT | `/api/routes/:id` | Оновити маршрут |
| DELETE | `/api/routes/:id` | Видалити маршрут |

### Потяги

| Метод | Шлях | Опис |
|-------|------|------|
| GET | `/api/trains` | Список усіх потягів |
| GET | `/api/trains/search` | Пошук потягів |
| POST | `/api/trains` | Створити потяг (admin) |
| POST | `/api/trains/:id/carriages` | Додати вагон (admin) |
| GET | `/api/trains/:id/seats` | Переглянути місця |

### Бронювання

| Метод | Шлях | Опис |
|-------|------|------|
| GET | `/api/bookings` | Мої бронювання |
| POST | `/api/bookings` | Забронювати місце |
| PATCH | `/api/bookings/:id/cancel` | Скасувати бронювання |

### Health Checks

| Метод | Шлях | Опис |
|-------|------|------|
| GET | `/health/alive` | Liveness probe |
| GET | `/health/ready` | Readiness probe (перевіряє БД) |

---

# Лабораторна робота №4 — IaC. Terraform. Ansible

## Варіант індивідуального завдання

**Номер у списку:** N = 3

| Параметр | Значення |
|----------|----------|
| Спосіб конфігурації | Конфігураційний файл `/etc/mywebapp/config.json` |
| Проєкт | Свій (TicketBooking) |
| Порт застосунку | `8000` |
| Порт бази даних | `5432` |
| Порт Nginx | `80` |

---

## Архітектура системи

```
                +--- VM1 (worker) ------+     +--- VM2 (db) --+
client  →  | nginx → web application |  →  | PostgreSQL     |
                +------------------------+     +----------------+
```

| Компонент | Адреса | Порт |
|-----------|--------|------|
| nginx | 0.0.0.0 | 80 |
| web app | 127.0.0.1 | 8000 |
| PostgreSQL | VM-IP | 5432 |

Доступ до бази даних обмежений — тільки з worker VM (через UFW).

---

## Передумови

| Компонент | Вимога |
|-----------|--------|
| ОС хоста | Linux з підтримкою KVM або WSL2 (Windows 11) |
| RAM | 6+ ГБ |
| CPU | 4+ ядра з VT-x/AMD-V |

### Для Windows (WSL2)

1. Встановити WSL2 з Ubuntu 24.04:
```powershell
wsl --install -d Ubuntu-24.04
```

2. Створити файл `C:\Users\<user>\.wslconfig`:
```ini
[wsl2]
nestedVirtualization=true
memory=6GB
processors=4
```

3. Перезапустити WSL:
```powershell
wsl --shutdown
wsl -d Ubuntu-24.04
```

4. Перевірити KVM:
```bash
sudo apt install -y cpu-checker
kvm-ok
# Має бути: KVM acceleration can be used
```

---

## Розгортання

### 1. Клонувати репозиторій

```bash
git clone https://github.com/IgorBelevyat/KPI2labs.git
cd KPI2labs
git checkout lab4
```

### 2. Підготувати хост

```bash
cd deploy/terraform
chmod +x setup-host.sh
./setup-host.sh
```

Скрипт автоматично встановить:

| Компонент | Призначення |
|-----------|-------------|
| qemu-kvm, libvirt | Гіпервізор та менеджер ВМ |
| Terraform | IaC — створення інфраструктури |
| Ansible | Configuration Management |
| genisoimage | Генерація cloud-init ISO |

Також скрипт:
- Додає користувача в групу `libvirt`
- Вимикає `security_driver` в QEMU
- Створює storage pool `default`
- Генерує SSH ключ для Ansible

### 3. Розгорнути інфраструктуру

```bash
newgrp libvirt
terraform init
terraform apply
```

Одна команда `terraform apply` виконує повний цикл:

| Крок | Що відбувається |
|------|-----------------|
| 1 | Створення NAT мережі `lab4-network` |
| 2 | Завантаження Ubuntu 24.04 cloud image |
| 3 | Створення дисків для worker та db |
| 4 | Генерація cloud-init ISO (SSH ключ, користувачі) |
| 5 | Запуск двох ВМ через KVM |
| 6 | Очікування отримання IP через DHCP |
| 7 | Генерація динамічного Ansible inventory |
| 8 | Запуск Ansible playbook для конфігурації |

### Очікуваний результат

```
Apply complete! Resources: 9 added, 0 changed, 0 destroyed.

Outputs:
  db_ip     = "192.168.56.x"
  worker_ip = "192.168.56.x"
```

---

## Provisioning (Terraform)

### Файли

| Файл | Призначення |
|------|-------------|
| `main.tf` | Мережа, volumes, domains, Ansible provisioner |
| `variables.tf` | Параметри ВМ (CPU, RAM, диск) |
| `outputs.tf` | Динамічні IP-адреси ВМ |
| `cloud-init.yml` | Ініціалізація ВМ (користувачі, пакети) |
| `network-config.yml` | DHCP для всіх `en*` інтерфейсів |
| `setup-host.sh` | Скрипт підготовки хоста |

### Провайдер

| Параметр | Значення |
|----------|----------|
| Провайдер | `dmacvicar/libvirt` v0.7.6 |
| URI | `qemu:///system` |
| Базовий образ | Ubuntu 24.04 Server Cloud Image |

### Ресурси

| Ресурс | Тип | Призначення |
|--------|-----|-------------|
| `lab_network` | `libvirt_network` | NAT мережа з DHCP |
| `ubuntu_base` | `libvirt_volume` | Базовий cloud image |
| `worker_disk` / `db_disk` | `libvirt_volume` | Диски ВМ (10 GB) |
| `worker_init` / `db_init` | `libvirt_cloudinit_disk` | Cloud-init ISO |
| `worker` | `libvirt_domain` | Worker VM (2 vCPU, 2 GB RAM) |
| `db` | `libvirt_domain` | DB VM (1 vCPU, 1 GB RAM) |
| `ansible` | `null_resource` | Запуск Ansible playbook |

---

## Configuration Management (Ansible)

### Файли

```
deploy/ansible/
├── playbook.yml              # Головний playbook
├── ansible.cfg               # Конфігурація Ansible
├── inventory.ini             # Статичний inventory (шаблон)
├── group_vars/
│   ├── all.yml               # Загальні змінні
│   ├── workers.yml           # Змінні для worker
│   └── db.yml                # Змінні для db
└── roles/
    ├── common/               # Базове налаштування (всі ВМ)
    ├── database/             # PostgreSQL (db VM)
    ├── app/                  # Node.js застосунок (worker VM)
    └── nginx/                # Nginx reverse proxy (worker VM)
```

### Inventory

Terraform автоматично генерує динамічний inventory з групами `[workers]` та `[db]` на основі DHCP-адрес ВМ.

### Ролі

#### `common` — базове налаштування (всі ВМ)

| Задача | Модуль |
|--------|--------|
| Оновлення apt cache | `apt` |
| Створення teacher | `user` |
| Створення app (тільки worker) | `user` |
| Створення operator (тільки worker) | `user` |
| Sudoers для operator | `copy` |
| Створення `/home/student/gradebook` | `copy` |
| SSH password authentication | `lineinfile` |

#### `database` — PostgreSQL (db VM)

| Задача | Модуль |
|--------|--------|
| Встановлення PostgreSQL | `apt` |
| Конфігурація listen_addresses | `lineinfile` |
| Конфігурація pg_hba.conf | `template` |
| Створення DB користувача | `postgresql_user` |
| Створення бази даних | `postgresql_db` |
| UFW: дозволити SSH | `ufw` |
| UFW: PostgreSQL тільки від worker | `ufw` |
| UFW: deny all incoming | `ufw` |

#### `app` — Node.js застосунок (worker VM)

| Задача | Модуль |
|--------|--------|
| Додати NodeSource GPG ключ | `apt_key` |
| Додати NodeSource репозиторій | `apt_repository` |
| Встановлення Node.js | `apt` |
| Клонування репозиторію | `git` |
| npm ci | `npm` |
| Prisma generate | `command` |
| Build | `command` |
| Конфігурація (`/etc/mywebapp/`) | `template` |
| Міграції БД | `command` |
| Systemd сервіс | `template` |

#### `nginx` — Reverse Proxy (worker VM)

| Задача | Модуль |
|--------|--------|
| Встановлення Nginx | `apt` |
| Видалення default site | `file` |
| Deploy конфігурації | `template` |
| Symlink sites-enabled | `file` |

### Ansible Templates

Всі конфігураційні файли генеруються через Jinja2 шаблони з динамічною підстановкою IP-адрес:

- `env.j2` — DATABASE_URL з IP бази даних
- `pg_hba.conf.j2` — доступ тільки з IP worker
- `mywebapp.conf.j2` — nginx proxy на 127.0.0.1:8000
- `mywebapp.service.j2` — systemd юніт від користувача `app`

---

## Користувачі

| Користувач | Де створюється | Присутній на | Права |
|------------|----------------|--------------|-------|
| `ansible` | cloud-init | Всі ВМ | sudo без пароля |
| `teacher` | Ansible (common) | Всі ВМ | sudo з паролем `12345678` |
| `app` | Ansible (common) | Worker | Системний, nologin |
| `operator` | Ansible (common) | Worker | Обмежений sudo (пароль `12345678`) |

### Права operator

```
operator ALL=(ALL) NOPASSWD: /usr/bin/systemctl start mywebapp
operator ALL=(ALL) NOPASSWD: /usr/bin/systemctl stop mywebapp
operator ALL=(ALL) NOPASSWD: /usr/bin/systemctl restart mywebapp
operator ALL=(ALL) NOPASSWD: /usr/bin/systemctl status mywebapp
operator ALL=(ALL) NOPASSWD: /usr/bin/systemctl reload nginx
```

---

## Перевірка розгортання

### 1. Health-check ендпоінти

```bash
curl http://<WORKER_IP>/health/alive
# Очікувано: OK

curl http://<WORKER_IP>/health/ready
# Очікувано: OK (перевіряє зв'язок з БД)
```

### 2. API

```bash
curl http://<WORKER_IP>/api/stations
# Очікувано: JSON масив
```

### 3. Перевірка сервісів

```bash
# SSH на worker
ssh -i deploy/ssh_key ansible@<WORKER_IP>
sudo systemctl status mywebapp    # active (running)
sudo systemctl status nginx       # active (running)

# SSH на db
ssh -i deploy/ssh_key ansible@<DB_IP>
sudo systemctl status postgresql   # active (running)
```

### 4. Перевірка безпеки

```bash
# DB доступна тільки з worker
ssh ansible@<WORKER_IP> "psql -h <DB_IP> -U mywebapp -d ticket_booking -c 'SELECT 1'"
# Очікувано: OK

# DB НЕ доступна ззовні
psql -h <DB_IP> -U mywebapp -d ticket_booking
# Очікувано: Connection refused (UFW блокує)
```

### 5. Перевірка користувачів

```bash
# Teacher — sudo з паролем
ssh teacher@<WORKER_IP>   # пароль: 12345678

# Operator — обмежений sudo
ssh operator@<WORKER_IP>  # пароль: 12345678
sudo systemctl status mywebapp    # Працює без пароля
sudo apt-get update               # ЗАБОРОНЕНО
```

### 6. Gradebook

```bash
cat /home/student/gradebook
# Очікувано: 3
```

---

## Знищення інфраструктури

```bash
cd deploy/terraform
terraform destroy
```
