import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/auth-middleware';
import { CreateBookingUseCase } from '../../application/use-cases/bookings/create-booking';
import { CancelBookingUseCase } from '../../application/use-cases/bookings/cancel-booking';
import { GetUserBookingsUseCase } from '../../application/use-cases/bookings/get-user-bookings';

export class BookingController {
  constructor(
    private readonly createUC: CreateBookingUseCase,
    private readonly cancelUC: CancelBookingUseCase,
    private readonly getUserBookingsUC: GetUserBookingsUseCase
  ) {}

  create = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.createUC.execute(req.userId!, req.body);
      res.status(201).json(result);
    } catch (err) { next(err); }
  };

  cancel = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.cancelUC.execute((req.params.id as string), req.userId!);
      res.json(result);
    } catch (err) { next(err); }
  };

  getMyBookings = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.getUserBookingsUC.execute(req.userId!);
      res.json(result);
    } catch (err) { next(err); }
  };
}
