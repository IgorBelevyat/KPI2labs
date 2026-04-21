import { DomainError } from '../errors/domain-error';

export class Station {
  private readonly _id: string;
  private _name: string;
  private _city: string;

  constructor(id: string, name: string, city: string) {
    if (!name || name.trim().length === 0) throw new DomainError('Station name cannot be empty');
    if (!city || city.trim().length === 0) throw new DomainError('Station city cannot be empty');
    this._id = id;
    this._name = name.trim();
    this._city = city.trim();
  }

  get id(): string { return this._id; }
  get name(): string { return this._name; }
  get city(): string { return this._city; }

  updateDetails(name: string, city: string): void {
    if (!name || name.trim().length === 0) throw new DomainError('Station name cannot be empty');
    if (!city || city.trim().length === 0) throw new DomainError('Station city cannot be empty');
    this._name = name.trim();
    this._city = city.trim();
  }

  equals(other: Station): boolean { return this._id === other._id; }
}
