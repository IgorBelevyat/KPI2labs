import { Request, Response, NextFunction } from 'express';
import { RegisterUserUseCase } from '../../application/use-cases/auth/register-user';
import { LoginUserUseCase } from '../../application/use-cases/auth/login-user';
import { RefreshTokenUseCase } from '../../application/use-cases/auth/refresh-token';

export class AuthController {
  constructor(
    private readonly registerUC: RegisterUserUseCase,
    private readonly loginUC: LoginUserUseCase,
    private readonly refreshUC: RefreshTokenUseCase
  ) {}

  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.registerUC.execute(req.body);
      res.status(201).json(result);
    } catch (err) { next(err); }
  };

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.loginUC.execute(req.body);
      res.json(result);
    } catch (err) { next(err); }
  };

  refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.refreshUC.execute(req.body);
      res.json(result);
    } catch (err) { next(err); }
  };
}
