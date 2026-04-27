import { Request, Response, NextFunction } from 'express';
import { TokenService } from '../../application/interfaces/token-service';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  userRole?: string;
}

export function createAuthMiddleware(tokenService: TokenService) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Access token required' });
      return;
    }

    try {
      const token = header.split(' ')[1];
      const payload = tokenService.verifyAccessToken(token);
      req.userId = payload.userId;
      req.userRole = payload.role;
      next();
    } catch {
      res.status(401).json({ error: 'Invalid or expired access token' });
    }
  };
}
