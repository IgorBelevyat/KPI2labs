import { DomainError } from '../errors/domain-error';

export class TrainNumber {
  private readonly _value: string;

  constructor(value: string) {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      throw new DomainError('Train number cannot be empty');
    }
    if (trimmed.length > 10) {
      throw new DomainError('Train number cannot exceed 10 characters');
    }
    this._value = trimmed.toUpperCase();
  }

  get value(): string { return this._value; }
  equals(other: TrainNumber): boolean { return this._value === other._value; }
  toString(): string { return this._value; }
}
