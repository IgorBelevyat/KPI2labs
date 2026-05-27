terraform {
  required_version = ">= 1.0"

  required_providers {
    libvirt = {
      source  = "dmacvicar/libvirt"
      version = "0.7.6"
    }
    null = {
      source  = "hashicorp/null"
      version = "~> 3.0"
    }
  }
}

provider "libvirt" {
  uri = var.libvirt_uri
}

# Мережа для ізоляції worker <-> db
resource "libvirt_network" "lab_network" {
  name      = "lab4-network"
  mode      = "nat"
  domain    = "lab4.local"
  addresses = ["192.168.56.0/24"]

  dhcp {
    enabled = true
  }

  dns {
    enabled = true
  }
}

# Базовий образ Ubuntu 24.04
resource "libvirt_volume" "ubuntu_base" {
  name   = "ubuntu-24.04-base.qcow2"
  pool   = "default"
  source = var.vm_image
  format = "qcow2"
}

# ---- Worker VM ----

resource "libvirt_volume" "worker_disk" {
  name           = "worker.qcow2"
  pool           = "default"
  base_volume_id = libvirt_volume.ubuntu_base.id
  size           = var.worker_disk_size
}

resource "libvirt_cloudinit_disk" "worker_init" {
  name           = "worker-cloudinit.iso"
  pool           = "default"
  user_data      = templatefile("${path.module}/cloud-init.yml", {
    ssh_public_key = trimspace(file(var.ssh_public_key_path))
  })
  network_config = file("${path.module}/network-config.yml")
}

resource "libvirt_domain" "worker" {
  name   = var.worker_name
  memory = var.worker_memory
  vcpu   = var.worker_cpus

  cloudinit = libvirt_cloudinit_disk.worker_init.id

  disk {
    volume_id = libvirt_volume.worker_disk.id
  }

  network_interface {
    network_id     = libvirt_network.lab_network.id
    wait_for_lease = true
  }

  console {
    type        = "pty"
    target_type = "serial"
    target_port = "0"
  }

  graphics {
    type        = "spice"
    listen_type = "address"
    autoport    = true
  }
}

# ---- Database VM ----

resource "libvirt_volume" "db_disk" {
  name           = "db.qcow2"
  pool           = "default"
  base_volume_id = libvirt_volume.ubuntu_base.id
  size           = var.db_disk_size
}

resource "libvirt_cloudinit_disk" "db_init" {
  name           = "db-cloudinit.iso"
  pool           = "default"
  user_data      = templatefile("${path.module}/cloud-init.yml", {
    ssh_public_key = trimspace(file(var.ssh_public_key_path))
  })
  network_config = file("${path.module}/network-config.yml")
}

resource "libvirt_domain" "db" {
  name   = var.db_name
  memory = var.db_memory
  vcpu   = var.db_cpus

  cloudinit = libvirt_cloudinit_disk.db_init.id

  disk {
    volume_id = libvirt_volume.db_disk.id
  }

  network_interface {
    network_id     = libvirt_network.lab_network.id
    wait_for_lease = true
  }

  console {
    type        = "pty"
    target_type = "serial"
    target_port = "0"
  }

  graphics {
    type        = "spice"
    listen_type = "address"
    autoport    = true
  }
}

# ---- Ansible Provisioning ----

resource "null_resource" "ansible" {
  depends_on = [libvirt_domain.worker, libvirt_domain.db]

  # Перезапускати при зміні IP
  triggers = {
    worker_ip = libvirt_domain.worker.network_interface[0].addresses[0]
    db_ip     = libvirt_domain.db.network_interface[0].addresses[0]
  }

  # Генерація динамічного inventory
  provisioner "local-exec" {
    command = <<-EOT
      # Копіювати SSH ключ з правильними permissions
      cp ${path.module}/../ssh_key /tmp/lab4_key
      chmod 600 /tmp/lab4_key

      # Створити динамічний inventory
      cat > /tmp/lab4_inventory.ini <<EOF
      [workers]
      worker ansible_host=${libvirt_domain.worker.network_interface[0].addresses[0]}

      [db]
      db ansible_host=${libvirt_domain.db.network_interface[0].addresses[0]}

      [all:vars]
      ansible_user=ansible
      ansible_ssh_private_key_file=/tmp/lab4_key
      ansible_ssh_common_args='-o StrictHostKeyChecking=no'
      EOF

      # Чекати поки SSH стане доступним
      echo "Waiting for SSH on worker..."
      for i in $(seq 1 30); do
        ssh -o StrictHostKeyChecking=no -o ConnectTimeout=5 -i /tmp/lab4_key ansible@${libvirt_domain.worker.network_interface[0].addresses[0]} true 2>/dev/null && break
        sleep 5
      done

      echo "Waiting for SSH on db..."
      for i in $(seq 1 30); do
        ssh -o StrictHostKeyChecking=no -o ConnectTimeout=5 -i /tmp/lab4_key ansible@${libvirt_domain.db.network_interface[0].addresses[0]} true 2>/dev/null && break
        sleep 5
      done

      # Запуск Ansible
      cd ${path.module}/../ansible
      export ANSIBLE_CONFIG=./ansible.cfg
      ansible-playbook -i /tmp/lab4_inventory.ini --become --become-method=sudo playbook.yml
    EOT
  }
}
