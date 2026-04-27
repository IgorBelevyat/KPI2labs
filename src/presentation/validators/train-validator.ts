import { Request, Response, NextFunction } from 'express';

export function validateCreateTrain(req: Request, res: Response, next: NextFunction): void {
  const { number, routeId, departureTime, arrivalTime } = req.body;
  const errors: string[] = [];

  if (!number || typeof number !== 'string') errors.push('Train number is required');
  if (!routeId || typeof routeId !== 'string') errors.push('Route ID is required');
  if (!departureTime || isNaN(Date.parse(departureTime))) errors.push('Valid departure time is required');
  if (!arrivalTime || isNaN(Date.parse(arrivalTime))) errors.push('Valid arrival time is required');

  if (errors.length > 0) { res.status(400).json({ errors }); return; }
  next();
}

export function validateUpdateTrain(req: Request, res: Response, next: NextFunction): void {
  validateCreateTrain(req, res, next);
}

export function validateAddCarriage(req: Request, res: Response, next: NextFunction): void {
  const { number, type, seatCount } = req.body;
  const errors: string[] = [];
  const validTypes = ['platskart', 'coupe', 'sv'];

  if (number === undefined || typeof number !== 'number') errors.push('Carriage number is required');
  if (!type || !validTypes.includes(type)) errors.push('Type must be one of: platskart, coupe, sv');
  if (!seatCount || typeof seatCount !== 'number' || seatCount < 1) errors.push('Seat count must be a positive number');

  if (errors.length > 0) { res.status(400).json({ errors }); return; }
  next();
}
