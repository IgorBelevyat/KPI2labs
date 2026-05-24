#!/bin/bash
set -e

cd "$(dirname "$0")/.."

echo "Зупинка поточних контейнерів..."
docker-compose down

echo "Підтягування нових Docker образів..."
docker-compose pull || true
docker-compose build --pull

echo "Запуск нових контейнерів..."
docker-compose up -d

echo "Розгортання завершено успішно!"
