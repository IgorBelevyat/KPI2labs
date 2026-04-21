import { Email } from '../value-objects/email';
import { Password } from '../value-objects/password';

export type UserRole = 'user' | 'admin';

export class User {
  private readonly _id: string;
  private _name: string;
  private _email: Email;
  private _passwordHash: Password;
  private _role: UserRole;

  constructor(id: string, name: string, email: Email, passwordHash: Password, role: UserRole = 'user') {
    this._id = id;
    this._name = name;
    this._email = email;
    this._passwordHash = passwordHash;
    this._role = role;
  }

  get id(): string { return this._id; }
  get name(): string { return this._name; }
  get email(): Email { return this._email; }
  get passwordHash(): Password { return this._passwordHash; }
  get role(): UserRole { return this._role; }

  isAdmin(): boolean { return this._role === 'admin'; }
  equals(other: User): boolean { return this._id === other._id; }
}
