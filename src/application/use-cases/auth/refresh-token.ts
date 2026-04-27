import { RefreshTokenDto, AuthResultDto } from '../../dto/auth-dto';
import { UserRepository } from '../../../domain/repositories/user-repository';
import { TokenService } from '../../interfaces/token-service';
import { DomainError, NotFoundError } from '../../../domain/errors/domain-error';

export class RefreshTokenUseCase {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly tokenService: TokenService
  ) {}

  async execute(dto: RefreshTokenDto): Promise<AuthResultDto> {
    let decoded;
    try {
      decoded = this.tokenService.verifyRefreshToken(dto.refreshToken);
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
