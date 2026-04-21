import { Email } from '../../../../src/domain/value-objects/email';
import { DomainError } from '../../../../src/domain/errors/domain-error';

describe('Email Value Object', () => {
  it('should create a valid email', () => {
    const email = new Email('Test@Example.COM');
    expect(email.value).toBe('test@example.com');
  });

  it('should normalize to lowercase', () => {
    const email = new Email('HELLO@WORLD.COM');
    expect(email.value).toBe('hello@world.com');
  });

  it('should return domain part', () => {
    const email = new Email('user@gmail.com');
    expect(email.domain).toBe('gmail.com');
  });

  it('should throw on missing @', () => {
    expect(() => new Email('invalid-email')).toThrow(DomainError);
  });

  it('should throw on missing domain', () => {
    expect(() => new Email('user@')).toThrow(DomainError);
  });

  it('should throw on empty string', () => {
    expect(() => new Email('')).toThrow(DomainError);
  });

  it('should compare equality by value', () => {
    const a = new Email('test@example.com');
    const b = new Email('TEST@EXAMPLE.COM');
    expect(a.equals(b)).toBe(true);
  });

  it('should detect inequality', () => {
    const a = new Email('a@example.com');
    const b = new Email('b@example.com');
    expect(a.equals(b)).toBe(false);
  });
});
