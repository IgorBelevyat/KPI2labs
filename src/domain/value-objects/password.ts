import { DomainError } from '../errors/domain-error';

export class Password {
  private readonly _value: string;
  private readonly _isHashed: boolean;

  private constructor(value: string, isHashed: boolean) {
    this._value = value;
    this._isHashed = isHashed;
  }

  static fromRaw(raw: string): Password {
    if (raw.length < 8) {
      throw new DomainError('Password must be at least 8 characters long');
    }
    if (!/[A-Z]/.test(raw)) {
      throw new DomainError('Password must contain at least one uppercase letter');
    }
    if (!/[0-9]/.test(raw)) {
      throw new DomainError('Password must contain at least one digit');
    }
    return new Password(raw, false);
  }

  static fromHash(hash: string): Password {
    return new Password(hash, true);
  }

  get value(): string { return this._value; }
  get isHashed(): boolean { return this._isHashed; }
}
