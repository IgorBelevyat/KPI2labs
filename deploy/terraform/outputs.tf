output "worker_ip" {
  description = "IP-адреса VM worker (nginx + app)"
  value       = libvirt_domain.worker.network_interface[0].addresses[0]
}

output "db_ip" {
  description = "IP-адреса VM db (PostgreSQL)"
  value       = libvirt_domain.db.network_interface[0].addresses[0]
}
