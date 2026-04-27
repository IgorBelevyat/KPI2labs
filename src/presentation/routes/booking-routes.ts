import { Router, RequestHandler } from 'express';
import { BookingController } from '../controllers/booking-controller';
import { validateCreateBooking } from '../validators/booking-validator';

export function createBookingRoutes(controller: BookingController, authMiddleware: RequestHandler): Router {
  const router = Router();

  router.post('/', authMiddleware, validateCreateBooking, controller.create);
  router.patch('/:id/cancel', authMiddleware, controller.cancel);
  router.get('/my', authMiddleware, controller.getMyBookings);

  return router;
}
