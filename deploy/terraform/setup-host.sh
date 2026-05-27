#!/bin/bash
set -e

echo "==> Встановлення системних залежностей..."
sudo apt update
sudo apt install -y qemu-kvm libvirt-daemon-system libvirt-dev \
  genisoimage xsltproc wget gnupg software-properties-common

echo "==> Встановлення Ansible..."
sudo apt install -y ansible

echo "==> Встановлення Terraform..."
if ! command -v terraform &>/dev/null; then
  wget -O- https://apt.releases.hashicorp.com/gpg | sudo gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg
  echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list
  sudo apt update && sudo apt install -y terraform
  echo "    Terraform встановлено"
else
  echo "    Terraform вже встановлений"
fi

echo "==> Додавання користувача в групу libvirt..."
sudo usermod -aG libvirt $(whoami)
sudo usermod -aG kvm $(whoami)

echo "==> Налаштування QEMU (вимкнення security driver)..."
if ! grep -q 'security_driver = "none"' /etc/libvirt/qemu.conf 2>/dev/null; then
  echo 'security_driver = "none"' | sudo tee -a /etc/libvirt/qemu.conf
  sudo systemctl restart libvirtd
  echo "    Security driver вимкнено"
else
  echo "    Security driver вже налаштований"
fi

echo "==> Запуск libvirtd..."
sudo systemctl start libvirtd
sudo systemctl enable libvirtd

echo "==> Створення storage pool..."
if ! sudo virsh pool-info default &>/dev/null; then
  sudo virsh pool-define-as default dir --target /var/lib/libvirt/images
  sudo virsh pool-start default
  sudo virsh pool-autostart default
  echo "    Storage pool 'default' створено"
else
  echo "    Storage pool 'default' вже існує"
fi

echo "==> Генерація SSH ключа..."
if [ ! -f ../ssh_key ]; then
  ssh-keygen -t ed25519 -f ../ssh_key -C "ansible@lab4" -N ""
  echo "    SSH ключ створено"
else
  echo "    SSH ключ вже існує"
fi

echo ""
echo "   Готово! Тепер виконай:"
echo "   newgrp libvirt"
echo "   terraform init"
echo "   terraform apply"
