import { Request, Response, NextFunction } from 'express';

export function validateCreateStation(req: Request, res: Response, next: NextFunction): void {
  const { name, city } = req.body;
  const errors: string[] = [];

  if (!name || typeof name !== 'string' || name.trim().length === 0) errors.push('Name is required');
  if (!city || typeof city !== 'string' || city.trim().length === 0) errors.push('City is required');

  if (errors.length > 0) { res.status(400).json({ errors }); return; }
  next();
}

export function validateUpdateStation(req: Request, res: Response, next: NextFunction): void {
  validateCreateStation(req, res, next);
}
