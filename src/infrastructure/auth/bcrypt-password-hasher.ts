import bcrypt from 'bcrypt';
import { PasswordHasher } from '../../domain/factories/user-factory';

const SALT_ROUNDS = 10;

export class BcryptPasswordHasher implements PasswordHasher {
  async hash(raw: string): Promise<string> {
    return bcrypt.hash(raw, SALT_ROUNDS);
  }

  async compare(raw: string, hash: string): Promise<boolean> {
    return bcrypt.compare(raw, hash);
  }
}
