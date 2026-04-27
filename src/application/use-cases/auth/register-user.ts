import { RegisterUserDto, AuthResultDto } from '../../dto/auth-dto';
import { UserFactory } from '../../../domain/factories/user-factory';
import { UserRepository } from '../../../domain/repositories/user-repository';
import { TokenService } from '../../interfaces/token-service';

export class RegisterUserUseCase {
  constructor(
    private readonly userFactory: UserFactory,
    private readonly userRepo: UserRepository,
    private readonly tokenService: TokenService
  ) {}

  async execute(dto: RegisterUserDto): Promise<AuthResultDto> {
    const user = await this.userFactory.create(dto.name, dto.email, dto.password);
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
