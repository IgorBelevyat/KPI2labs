import { Request, Response, NextFunction } from 'express';

export function validateCreateBooking(req: Request, res: Response, next: NextFunction): void {
  const { trainId, seatId, travelDate } = req.body;
  const errors: string[] = [];

  if (!trainId || typeof trainId !== 'string') errors.push('Train ID is required');
  if (!seatId || typeof seatId !== 'string') errors.push('Seat ID is required');
  if (!travelDate || isNaN(Date.parse(travelDate))) errors.push('Valid travel date is required');

  if (errors.length > 0) { res.status(400).json({ errors }); return; }
  next();
}
