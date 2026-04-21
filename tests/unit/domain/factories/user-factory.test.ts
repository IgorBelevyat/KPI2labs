import { UserFactory, PasswordHasher } from '../../../../src/domain/factories/user-factory';
import { User } from '../../../../src/domain/models/user';
import { Email } from '../../../../src/domain/value-objects/email';
import { Password } from '../../../../src/domain/value-objects/password';
import { InMemoryUserRepo } from '../../../helpers/in-memory-repos';
import { ConflictError, DomainError } from '../../../../src/domain/errors/domain-error';

class FakeHasher implements PasswordHasher {
  async hash(raw: string): Promise<string> { return `hashed_${raw}`; }
}

describe('UserFactory', () => {
  let repo: InMemoryUserRepo;
  let factory: UserFactory;

  beforeEach(() => {
    repo = new InMemoryUserRepo();
    factory = new UserFactory(repo, new FakeHasher());
  });

  it('should create a user with hashed password', async () => {
    const user = await factory.create('John', 'john@example.com', 'Password1');
    expect(user.name).toBe('John');
    expect(user.email.value).toBe('john@example.com');
    expect(user.passwordHash.value).toBe('hashed_Password1');
    expect(user.passwordHash.isHashed).toBe(true);
    expect(user.role).toBe('user');
  });

  it('should throw on duplicate email', async () => {
    const existing = new User('x', 'Ex', new Email('john@example.com'), Password.fromHash('h'));
    await repo.save(existing);
    await expect(factory.create('John', 'john@example.com', 'Password1')).rejects.toThrow(ConflictError);
  });

  it('should throw on empty name', async () => {
    await expect(factory.create('', 'john@example.com', 'Password1')).rejects.toThrow(DomainError);
  });

  it('should throw on invalid email', async () => {
    await expect(factory.create('John', 'not-an-email', 'Password1')).rejects.toThrow(DomainError);
  });

  it('should throw on weak password', async () => {
    await expect(factory.create('John', 'john@example.com', 'weak')).rejects.toThrow(DomainError);
  });
});
