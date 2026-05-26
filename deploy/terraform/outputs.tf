output "worker_ip" {
  description = "IP-адреса VM worker (nginx + app)"
  value       = virtualbox_vm.worker.network_adapter.0.ipv4_address
}

output "db_ip" {
  description = "IP-адреса VM db (PostgreSQL)"
  value       = virtualbox_vm.db.network_adapter.0.ipv4_address
}
