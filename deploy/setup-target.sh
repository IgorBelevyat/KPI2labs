#!/bin/bash
set -e


echo "Оновлення системи..."
sudo apt-get update && sudo apt-get upgrade -y

echo "Встановлення необхідних пакетів (curl, git, nginx)..."
sudo apt-get install -y curl git nginx

echo "Встановлення Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    rm get-docker.sh
    
    sudo usermod -aG docker $USER
    echo "Docker встановлено."
else
    echo "Docker вже встановлено."
fi

echo "Встановлення Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    echo "Docker Compose встановлено."
else
    echo "Docker Compose вже встановлено."
fi

echo "Налаштування Docker daemon для запуску при завантаженні..."
sudo systemctl enable docker
sudo systemctl start docker

mkdir -p ~/kpi2labs-deployment


echo "Машина готова до роботи!"
echo "Додайте публічний SSH-ключ з вашого Раннера"
echo "у файл ~/.ssh/authorized_keys на цій машині для безпарольного доступу."

