import { User as PrismaUser } from '@prisma/client';
import { User } from '../../domain/models/user';
import { Email } from '../../domain/value-objects/email';
import { Password } from '../../domain/value-objects/password';

export class UserMapper {
  static toDomain(raw: PrismaUser): User {
    return new User(
      raw.id,
      raw.name,
      new Email(raw.email),
      Password.fromHash(raw.passwordHash),
      raw.role as 'user' | 'admin'
    );
  }

  static toPersistence(user: User) {
    return {
      id: user.id,
      name: user.name,
      email: user.email.value,
      passwordHash: user.passwordHash.value,
      role: user.role,
    };
  }
}
