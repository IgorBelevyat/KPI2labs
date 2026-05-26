variable "vm_image" {
  description = "URL або шлях до Vagrant box образу Ubuntu"
  type        = string
  default     = "https://app.vagrantup.com/bento/boxes/ubuntu-24.04/versions/202502.21.0/providers/virtualbox/amd64/vagrant.box"
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
  description = "Кількість CPU для worker VM"
  type        = number
  default     = 2
}

variable "worker_memory" {
  description = "Оперативна пам'ять для worker VM (MiB)"
  type        = string
  default     = "2048 mib"
}

variable "db_cpus" {
  description = "Кількість CPU для DB VM"
  type        = number
  default     = 1
}

variable "db_memory" {
  description = "Оперативна пам'ять для DB VM (MiB)"
  type        = string
  default     = "1024 mib"
}

variable "host_interface" {
  description = "Ім'я Host-Only мережевого адаптера VirtualBox"
  type        = string
  default     = "vboxnet0"
}

variable "ssh_public_key_path" {
  description = "Шлях до файлу публічного SSH-ключа"
  type        = string
  default     = "../ssh_key.pub"
}
