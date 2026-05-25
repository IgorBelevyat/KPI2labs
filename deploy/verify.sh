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
        echo "Сервіс фронтенду доступний (HTTP STATUS: $HTTP_STATUS)"
    else
        echo "Помилка: Сервіс фронтенду недоступний (HTTP STATUS: $HTTP_STATUS)"
        exit 1
    fi

    # 1.5 Перевірка доступності Бекенду (API health check) з очікуванням
    echo "Очікування готовності API (до 60 секунд)..."
    API_STATUS=0
    for i in {1..12}; do
        API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/api/health)
        if [ "$API_STATUS" -eq 200 ]; then
            echo "API працює стабільно (HTTP STATUS: $API_STATUS)"
            break
        fi
        echo "API ще не готове (Отримано $API_STATUS). Чекаємо 5 секунд..."
        sleep 5
    done

    if [ "$API_STATUS" -ne 200 ]; then
        echo "Помилка: API не працює або лежить (HTTP STATUS: $API_STATUS)"
        echo "=== ЛОГИ БЕКЕНДУ (ticketbooking-web) ==="
        docker logs ticketbooking-web --tail 50
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

