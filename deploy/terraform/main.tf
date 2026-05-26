terraform {
  required_version = ">= 1.0"

  required_providers {
    libvirt = {
      source  = "dmacvicar/libvirt"
      version = "~> 0.8"
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
  name      = "worker-cloudinit.iso"
  pool      = "default"
  user_data = templatefile("${path.module}/cloud-init.yml", {
    ssh_public_key = trimspace(file(var.ssh_public_key_path))
  })

  network_config = templatefile("${path.module}/network-config.yml", {
    ip_address = var.worker_ip
  })
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
    addresses      = [var.worker_ip]
    wait_for_lease = true
  }

  console {
    type        = "pty"
    target_port = "0"
    target_type = "serial"
  }

  graphics {
    type        = "vnc"
    listen_type = "address"
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
  name      = "db-cloudinit.iso"
  pool      = "default"
  user_data = templatefile("${path.module}/cloud-init.yml", {
    ssh_public_key = trimspace(file(var.ssh_public_key_path))
  })

  network_config = templatefile("${path.module}/network-config.yml", {
    ip_address = var.db_ip
  })
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
    addresses      = [var.db_ip]
    wait_for_lease = true
  }

  console {
    type        = "pty"
    target_port = "0"
    target_type = "serial"
  }

  graphics {
    type        = "vnc"
    listen_type = "address"
  }
}
