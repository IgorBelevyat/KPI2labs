output "worker_ip" {
  description = "IP-адреса VM worker (nginx + app)"
  value       = var.worker_ip
}

output "db_ip" {
  description = "IP-адреса VM db (PostgreSQL)"
  value       = var.db_ip
}
