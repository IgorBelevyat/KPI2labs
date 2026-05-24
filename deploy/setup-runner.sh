#!/bin/bash
set -e

echo "Оновлення системи..."
sudo apt-get update && sudo apt-get upgrade -y

echo "Встановлення необхідних пакетів (curl, jq, openssh-client)..."
sudo apt-get install -y curl jq openssh-client

echo "Генерація SSH-ключа для доступу до Target Node..."
if [ ! -f ~/.ssh/id_rsa ]; then
    ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa -N ""
    echo "SSH ключ успішно згенеровано."
else
    echo "SSH ключ вже існує."
fi

echo "Раннер-машина готова."
echo ""
echo "Наступні кроки:"
echo "1. Скопіюйте цей публічний ключ і додайте його на цільову машину"
echo "   у файл ~/.ssh/authorized_keys:"
echo ""
cat ~/.ssh/id_rsa.pub
echo ""
echo "2. Перевірте, що ви можете підключитися по SSH до цільової машини без пароля:"
echo "   ssh user@<target_ip>"
echo ""
echo "3. Підключіть GitHub Runner:"
echo "   - Перейдіть у репозиторій на GitHub: Settings -> Actions -> Runners -> New self-hosted runner"
echo "   - Виконайте команди з розділу 'Download' (mkdir, curl, tar)"
echo "   - Виконайте команди з розділу 'Configure', ввівши ваш приватний токен."
echo "   - Встановіть runner як сервіс:"
echo "     sudo ./svc.sh install && sudo ./svc.sh start"

