#!/bin/bash
set -e

if [ -z "$TARGET_USER" ] || [ -z "$TARGET_HOST" ]; then
    echo "Помилка: Змінні середовища TARGET_USER та TARGET_HOST не задані."
    exit 1
fi

TARGET="${TARGET_USER}@${TARGET_HOST}"
SSH_OPTS="-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null"

sleep 5

echo "Запуск скрипта верифікації через SSH..."
ssh $SSH_OPTS $TARGET << 'EOF'
    set -e

    # 1. Перевірка доступності сервісу (Nginx має відповідати на 80 порту)
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost)

    if [ "$HTTP_STATUS" -eq 200 ] || [ "$HTTP_STATUS" -eq 301 ] || [ "$HTTP_STATUS" -eq 404 ]; then
        echo "Сервіс доступний (HTTP STATUS: $HTTP_STATUS)"
    else
        echo "Помилка: Сервіс недоступний (HTTP STATUS: $HTTP_STATUS)"
        exit 1
    fi

    # 2. Перевірка статусу контейнерів
    FAILED_CONTAINERS=$(docker ps -a --format '{{.Names}} {{.Status}}' | grep "Exited" || true)

    if [ -n "$FAILED_CONTAINERS" ]; then
        echo "Помилка: Знайдені контейнери, які впали:"
        echo "$FAILED_CONTAINERS"
        exit 1
    else
        echo "Всі контейнери працюють стабільно."
    fi

    # 3. Перевірка конфігурації Nginx всередині контейнера
    docker exec ticketbooking-nginx nginx -t
    if [ $? -eq 0 ]; then
        echo "Конфігурація Nginx валідна."
    else
        echo "Помилка: Конфігурація Nginx невалідна!"
        exit 1
    fi
EOF

echo "Верифікація пройшла успішно!"

