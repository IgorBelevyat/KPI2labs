import { User } from '../../../src/domain/models/user';
import { UserRepository } from '../../../src/domain/repositories/user-repository';

export class InMemoryUserRepo implements UserRepository {
  private users: User[] = [];

  async save(u: User): Promise<void> { this.users.push(u); }
  async findById(id: string): Promise<User | null> { return this.users.find(u => u.id === id) ?? null; }
  async findByEmail(email: string): Promise<User | null> { return this.users.find(u => u.email.value === email) ?? null; }
  async existsByEmail(email: string): Promise<boolean> { return this.users.some(u => u.email.value === email); }
}
