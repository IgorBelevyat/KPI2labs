import { RefreshTokenCommand } from './refresh-token.command';
import { UserRepository } from '../../../domain/repositories/user-repository';
import { TokenService } from '../../../../../shared/auth/token-service.interface';
import { DomainError, NotFoundError } from '../../../../../shared/errors/domain-error';
import { AuthResult } from './register-user.handler';

export class RefreshTokenCommandHandler {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly tokenService: TokenService
  ) {}

  async handle(command: RefreshTokenCommand): Promise<AuthResult> {
    let decoded;
    try {
      decoded = this.tokenService.verifyRefreshToken(command.refreshToken);
    } catch {
      throw new DomainError('Invalid or expired refresh token');
    }

    const user = await this.userRepo.findById(decoded.userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

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
