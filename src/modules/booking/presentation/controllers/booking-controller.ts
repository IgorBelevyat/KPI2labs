import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../../../shared/middlewares/auth-middleware';
import { CreateBookingCommandHandler } from '../../application/commands/bookings/create-booking.handler';
import { CancelBookingCommandHandler } from '../../application/commands/bookings/cancel-booking.handler';
import { GetUserBookingsQueryHandler } from '../../application/queries/bookings/get-user-bookings.handler';

export class BookingController {
  constructor(
    private readonly createHandler: CreateBookingCommandHandler,
    private readonly cancelHandler: CancelBookingCommandHandler,
    private readonly getBookingsHandler: GetUserBookingsQueryHandler
  ) {}

  create = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.createHandler.handle({
        userId: req.userId!,
        ...req.body,
      });
      res.status(201).json(result);
    } catch (err) { next(err); }
  };

  cancel = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.cancelHandler.handle({
        bookingId: req.params.id as string,
        userId: req.userId!,
      });
      res.status(204).send();
    } catch (err) { next(err); }
  };

  getMyBookings = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.getBookingsHandler.handle({ userId: req.userId! });
      res.json(result);
    } catch (err) { next(err); }
  };
}
