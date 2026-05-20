import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../shared/middlewares/auth-middleware';

export function adminMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (req.userRole !== 'admin') {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }
  next();
}
