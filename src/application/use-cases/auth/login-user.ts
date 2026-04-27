import { LoginUserDto, AuthResultDto } from '../../dto/auth-dto';
import { UserRepository } from '../../../domain/repositories/user-repository';
import { PasswordHasher } from '../../interfaces/password-hasher';
import { TokenService } from '../../interfaces/token-service';
import { DomainError } from '../../../domain/errors/domain-error';

export class LoginUserUseCase {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly hasher: PasswordHasher,
    private readonly tokenService: TokenService
  ) {}

  async execute(dto: LoginUserDto): Promise<AuthResultDto> {
    const user = await this.userRepo.findByEmail(dto.email.toLowerCase());
    if (!user) {
      throw new DomainError('Invalid email or password');
    }

    const isValid = await this.hasher.compare(dto.password, user.passwordHash.value);
    if (!isValid) {
      throw new DomainError('Invalid email or password');
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
