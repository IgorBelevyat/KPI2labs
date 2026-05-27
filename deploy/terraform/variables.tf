variable "libvirt_uri" {
  description = "URI підключення до libvirt"
  type        = string
  default     = "qemu:///system"
}

variable "vm_image" {
  description = "URL або шлях до cloud-образу Ubuntu 24.04 (qcow2)"
  type        = string
  default     = "https://cloud-images.ubuntu.com/releases/24.04/release/ubuntu-24.04-server-cloudimg-amd64.img"
}

variable "worker_name" {
  description = "Ім'я VM для worker (nginx + app)"
  type        = string
  default     = "worker"
}

variable "db_name" {
  description = "Ім'я VM для бази даних"
  type        = string
  default     = "db"
}

variable "worker_cpus" {
  description = "Кількість vCPU для worker VM"
  type        = number
  default     = 2
}

variable "worker_memory" {
  description = "Оперативна пам'ять для worker VM (MiB)"
  type        = number
  default     = 2048
}

variable "worker_disk_size" {
  description = "Розмір диску worker VM (bytes)"
  type        = number
  default     = 10737418240  # 10 GB
}

variable "db_cpus" {
  description = "Кількість vCPU для DB VM"
  type        = number
  default     = 1
}

variable "db_memory" {
  description = "Оперативна пам'ять для DB VM (MiB)"
  type        = number
  default     = 1024
}

variable "db_disk_size" {
  description = "Розмір диску DB VM (bytes)"
  type        = number
  default     = 10737418240  # 10 GB
}

variable "ssh_public_key_path" {
  description = "Шлях до файлу публічного SSH-ключа"
  type        = string
  default     = "../ssh_key.pub"
}
