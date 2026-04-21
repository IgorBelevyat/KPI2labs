import { DomainError } from '../errors/domain-error';

export class Email {
  private readonly _value: string;

  constructor(value: string) {
    const normalized = value.trim().toLowerCase();
    if (!Email.isValid(normalized)) {
      throw new DomainError(`Invalid email format: ${value}`);
    }
    this._value = normalized;
  }

  get value(): string { return this._value; }
  get domain(): string { return this._value.split('@')[1]; }

  equals(other: Email): boolean { return this._value === other._value; }
  toString(): string { return this._value; }

  private static isValid(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
}
