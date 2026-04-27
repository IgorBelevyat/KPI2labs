import { Request, Response, NextFunction } from 'express';

export function validateRegister(req: Request, res: Response, next: NextFunction): void {
  const { name, email, password } = req.body;
  const errors: string[] = [];

  if (!name || typeof name !== 'string' || name.trim().length === 0) errors.push('Name is required');
  if (!email || typeof email !== 'string' || !email.includes('@')) errors.push('Valid email is required');
  if (!password || typeof password !== 'string' || password.length < 6) errors.push('Password must be at least 6 characters');

  if (errors.length > 0) { res.status(400).json({ errors }); return; }
  next();
}

export function validateLogin(req: Request, res: Response, next: NextFunction): void {
  const { email, password } = req.body;
  const errors: string[] = [];

  if (!email || typeof email !== 'string') errors.push('Email is required');
  if (!password || typeof password !== 'string') errors.push('Password is required');

  if (errors.length > 0) { res.status(400).json({ errors }); return; }
  next();
}

export function validateRefreshToken(req: Request, res: Response, next: NextFunction): void {
  const { refreshToken } = req.body;
  if (!refreshToken || typeof refreshToken !== 'string') {
    res.status(400).json({ errors: ['Refresh token is required'] });
    return;
  }
  next();
}
