#!/bin/bash
set -e

echo "Розпочинаємо розгортання проєкту на цільовій машині..."

if [ -z "$TARGET_USER" ] || [ -z "$TARGET_HOST" ]; then
    echo "Помилка: Змінні середовища TARGET_USER та TARGET_HOST не задані."
    echo "Переконайтеся, що ви додали їх у GitHub Secrets."
    exit 1
fi

TARGET="${TARGET_USER}@${TARGET_HOST}"
DEPLOY_DIR="~/kpi2labs-deployment"

SSH_OPTS="-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null"

echo "Створення директорії на цільовій машині (якщо не існує)..."
ssh $SSH_OPTS $TARGET "mkdir -p $DEPLOY_DIR"

echo "Копіювання файлів конфігурації (docker-compose.yml)..."
cd "$(dirname "$0")/.."
scp $SSH_OPTS docker-compose.yml $TARGET:$DEPLOY_DIR/docker-compose.yml

echo "Запуск розгортання на цільовій машині..."
ssh $SSH_OPTS $TARGET << EOF
    set -e
    cd $DEPLOY_DIR
    echo "Зупинка поточних контейнерів..."
    docker-compose down

    echo "Підтягування нових Docker образів з GHCR..."

    docker-compose pull || true
    
    docker-compose build --pull

    echo "Запуск нових контейнерів..."
    docker-compose up -d
EOF

echo "Розгортання завершено успішно!"
