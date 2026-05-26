#!/bin/bash
set -e

echo "==> Встановлення залежностей..."
sudo apt update
sudo apt install -y qemu-kvm libvirt-daemon-system libvirt-dev genisoimage

echo "==> Додавання користувача в групу libvirt..."
sudo usermod -aG libvirt $(whoami)
sudo usermod -aG kvm $(whoami)

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
