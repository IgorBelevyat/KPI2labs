import { RegisterUserCommand } from './register-user.command';
import { UserFactory } from '../../../domain/factories/user-factory';
import { UserRepository } from '../../../domain/repositories/user-repository';
import { TokenService } from '../../interfaces/token-service';

export interface AuthResult {
  user: { id: string; name: string; email: string; role: string };
  accessToken: string;
  refreshToken: string;
}

export class RegisterUserCommandHandler {
  constructor(
    private readonly userFactory: UserFactory,
    private readonly userRepo: UserRepository,
    private readonly tokenService: TokenService
  ) {}

  async handle(command: RegisterUserCommand): Promise<AuthResult> {
    const user = await this.userFactory.create(command.name, command.email, command.password);
    await this.userRepo.save(user);

    const payload = { userId: user.id, role: user.role };
    const accessToken = this.tokenService.generateAccessToken(payload);
    const refreshToken = this.tokenService.generateRefreshToken(payload);

    return {
      user: { id: user.id, name: user.name, email: user.email.value, role: user.role },
      accessToken,
      refreshToken,
    };
  }
}
