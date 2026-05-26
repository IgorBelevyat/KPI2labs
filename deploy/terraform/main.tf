terraform {
  required_version = ">= 1.0"

  required_providers {
    virtualbox = {
      source  = "terra-farm/virtualbox"
      version = "0.2.2-alpha.1"
    }
  }
}

provider "virtualbox" {}


# VM1 — Worker (nginx + web application)

resource "virtualbox_vm" "worker" {
  name   = var.worker_name
  image  = var.vm_image
  cpus   = var.worker_cpus
  memory = var.worker_memory

  user_data = templatefile("${path.module}/cloud-init.yml", {
    ssh_public_key = trimspace(file(var.ssh_public_key_path))
  })

  network_adapter {
    type           = "hostonly"
    host_interface = var.host_interface
  }
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

  network_adapter {
    type           = "hostonly"
    host_interface = var.host_interface
  }
}
