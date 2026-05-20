import { Request, Response, NextFunction } from 'express';
import { RegisterUserCommandHandler } from '../../application/commands/auth/register-user.handler';
import { LoginUserCommandHandler } from '../../application/commands/auth/login-user.handler';
import { RefreshTokenCommandHandler } from '../../application/commands/auth/refresh-token.handler';

export class AuthController {
  constructor(
    private readonly registerHandler: RegisterUserCommandHandler,
    private readonly loginHandler: LoginUserCommandHandler,
    private readonly refreshHandler: RefreshTokenCommandHandler
  ) {}

  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.registerHandler.handle(req.body);
      res.status(201).json(result);
    } catch (err) { next(err); }
  };

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.loginHandler.handle(req.body);
      res.json(result);
    } catch (err) { next(err); }
  };

  refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.refreshHandler.handle(req.body);
      res.json(result);
    } catch (err) { next(err); }
  };
}
