terraform {
  required_version = ">= 1.0"

  required_providers {
    virtualbox = {
      source  = "terra-farm/virtualbox"
      version = "0.2.2-alpha.1"
    }
    null = {
      source  = "hashicorp/null"
      version = "~> 3.0"
    }
  }
}

provider "virtualbox" {}

variable "worker_ip" {
  description = "Статична IP-адреса для worker VM"
  type        = string
  default     = "192.168.56.101"
}

variable "db_ip" {
  description = "Статична IP-адреса для db VM"
  type        = string
  default     = "192.168.56.102"
}

# VM1 — Worker (nginx + web application)
resource "virtualbox_vm" "worker" {
  name   = var.worker_name
  image  = var.vm_image
  cpus   = var.worker_cpus
  memory = var.worker_memory

  user_data = templatefile("${path.module}/cloud-init.yml", {
    ssh_public_key = trimspace(file(var.ssh_public_key_path))
  })
}

# VM2 — Database (PostgreSQL)
resource "virtualbox_vm" "db" {
  name   = var.db_name
  image  = var.vm_image
  cpus   = var.db_cpus
  memory = var.db_memory

  user_data = templatefile("${path.module}/cloud-init.yml", {
    ssh_public_key = trimspace(file(var.ssh_public_key_path))
  })
}

# Налаштування мережі — VirtualBox 7.x використовує hostonlynet
resource "null_resource" "setup_worker_network" {
  depends_on = [virtualbox_vm.worker]

  provisioner "local-exec" {
    command = <<-EOT
      VBoxManage controlvm ${var.worker_name} poweroff 2>/dev/null || true
      sleep 2
      VBoxManage modifyvm ${var.worker_name} --nic1 hostonlynet --host-only-net1 "${var.host_interface}"
      VBoxManage startvm ${var.worker_name} --type headless
    EOT
  }
}

resource "null_resource" "setup_db_network" {
  depends_on = [virtualbox_vm.db]

  provisioner "local-exec" {
    command = <<-EOT
      VBoxManage controlvm ${var.db_name} poweroff 2>/dev/null || true
      sleep 2
      VBoxManage modifyvm ${var.db_name} --nic1 hostonlynet --host-only-net1 "${var.host_interface}"
      VBoxManage startvm ${var.db_name} --type headless
    EOT
  }
}

