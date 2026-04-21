import { User } from '../../../../src/domain/models/user';
import { Email } from '../../../../src/domain/value-objects/email';
import { Password } from '../../../../src/domain/value-objects/password';

describe('User Entity', () => {
  const makeUser = (role: 'user' | 'admin' = 'user') => {
    return new User(
      'u-1',
      'John Doe',
      new Email('john@example.com'),
      Password.fromHash('hashed'),
      role
    );
  };

  it('should create a valid user', () => {
    const user = makeUser();
    expect(user.id).toBe('u-1');
    expect(user.name).toBe('John Doe');
    expect(user.email.value).toBe('john@example.com');
    expect(user.role).toBe('user');
  });

  it('should detect admin role', () => {
    expect(makeUser('admin').isAdmin()).toBe(true);
    expect(makeUser('user').isAdmin()).toBe(false);
  });

  it('should compare equality by id', () => {
    const a = makeUser();
    const b = new User('u-1', 'Other', new Email('other@test.com'), Password.fromHash('x'));
    expect(a.equals(b)).toBe(true);
  });
});
