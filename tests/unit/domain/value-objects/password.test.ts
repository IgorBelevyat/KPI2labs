import { Password } from '../../../../src/domain/value-objects/password';
import { DomainError } from '../../../../src/domain/errors/domain-error';

describe('Password Value Object', () => {
  it('should create from valid raw password', () => {
    const pw = Password.fromRaw('StrongPass1');
    expect(pw.value).toBe('StrongPass1');
    expect(pw.isHashed).toBe(false);
  });

  it('should throw if too short', () => {
    expect(() => Password.fromRaw('Ab1')).toThrow(DomainError);
    expect(() => Password.fromRaw('Ab1')).toThrow('at least 8 characters');
  });

  it('should throw if no uppercase letter', () => {
    expect(() => Password.fromRaw('lowercase1')).toThrow(DomainError);
    expect(() => Password.fromRaw('lowercase1')).toThrow('uppercase');
  });

  it('should throw if no digit', () => {
    expect(() => Password.fromRaw('NoDigitHere')).toThrow(DomainError);
    expect(() => Password.fromRaw('NoDigitHere')).toThrow('digit');
  });

  it('should create from hash without validation', () => {
    const pw = Password.fromHash('$2b$10$somehashvalue');
    expect(pw.value).toBe('$2b$10$somehashvalue');
    expect(pw.isHashed).toBe(true);
  });
});
