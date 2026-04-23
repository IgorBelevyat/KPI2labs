import { PrismaClient } from '@prisma/client';
import { User } from '../../domain/models/user';
import { UserRepository } from '../../domain/repositories/user-repository';
import { UserMapper } from '../mappers/user-mapper';

export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(user: User): Promise<void> {
    const data = UserMapper.toPersistence(user);
    await this.prisma.user.upsert({
      where: { id: data.id },
      update: data,
      create: data,
    });
  }

  async findById(id: string): Promise<User | null> {
    const raw = await this.prisma.user.findUnique({ where: { id } });
    return raw ? UserMapper.toDomain(raw) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const raw = await this.prisma.user.findUnique({ where: { email } });
    return raw ? UserMapper.toDomain(raw) : null;
  }

  async existsByEmail(email: string): Promise<boolean> {
    const count = await this.prisma.user.count({ where: { email } });
    return count > 0;
  }
}
