import { Router, RequestHandler } from 'express';
import { AuthController } from '../controllers/auth-controller';
import { StationController } from '../controllers/station-controller';
import { RouteController } from '../controllers/route-controller';
import { TrainController } from '../controllers/train-controller';
import { BookingController } from '../controllers/booking-controller';
import { createAuthRoutes } from './auth-routes';
import { createStationRoutes } from './station-routes';
import { createRouteRoutes } from './route-routes';
import { createTrainRoutes } from './train-routes';
import { createBookingRoutes } from './booking-routes';

interface Controllers {
  auth: AuthController;
  station: StationController;
  route: RouteController;
  train: TrainController;
  booking: BookingController;
}

export function createApiRouter(controllers: Controllers, authMiddleware: RequestHandler): Router {
  const router = Router();

  router.use('/auth', createAuthRoutes(controllers.auth));
  router.use('/stations', createStationRoutes(controllers.station, authMiddleware));
  router.use('/routes', createRouteRoutes(controllers.route, authMiddleware));
  router.use('/trains', createTrainRoutes(controllers.train, authMiddleware));
  router.use('/bookings', createBookingRoutes(controllers.booking, authMiddleware));

  return router;
}
