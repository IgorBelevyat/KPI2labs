import { Request, Response, NextFunction } from 'express';

export function validateCreateRoute(req: Request, res: Response, next: NextFunction): void {
  const { stops } = req.body;
  const errors: string[] = [];

  if (!Array.isArray(stops)) { errors.push('Stops must be an array'); }
  else if (stops.length < 2) { errors.push('At least 2 stops are required'); }
  else {
    stops.forEach((s: { stationId?: string; orderIndex?: number }, i: number) => {
      if (!s.stationId || typeof s.stationId !== 'string') errors.push(`Stop ${i}: stationId is required`);
      if (s.orderIndex === undefined || typeof s.orderIndex !== 'number') errors.push(`Stop ${i}: orderIndex is required`);
    });
  }

  if (errors.length > 0) { res.status(400).json({ errors }); return; }
  next();
}

export function validateUpdateRoute(req: Request, res: Response, next: NextFunction): void {
  validateCreateRoute(req, res, next);
}
