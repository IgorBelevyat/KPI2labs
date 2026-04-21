import { v4 as uuidv4 } from 'uuid';
import { User } from '../models/user';
import { Email } from '../value-objects/email';
import { Password } from '../value-objects/password';
import { UserRepository } from '../repositories/user-repository';
import { DomainError, ConflictError } from '../errors/domain-error';

export interface PasswordHasher {
    hash(raw: string): Promise<string>;
}

export class UserFactory {
    constructor(
        private readonly userRepo: UserRepository,
        private readonly hasher: PasswordHasher
    ) { }

    async create(name: string, rawEmail: string, rawPassword: string): Promise<User> {
        if (!name || name.trim().length === 0) {
            throw new DomainError('User name cannot be empty');
        }

        const email = new Email(rawEmail);
        const password = Password.fromRaw(rawPassword);

        // email must be unique (needs DB)
        const exists = await this.userRepo.existsByEmail(email.value);
        if (exists) {
            throw new ConflictError(`User with email ${email.value} already exists`);
        }

        const hashedPassword = await this.hasher.hash(password.value);

        return new User(
            uuidv4(),
            name.trim(),
            email,
            Password.fromHash(hashedPassword),
            'user'
        );
    }
}
