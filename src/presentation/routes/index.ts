import { Router, RequestHandler } from 'express';
import { AuthController } from '../../modules/booking/presentation/controllers/auth-controller';
import { StationController } from '../../modules/catalog/presentation/controllers/station-controller';
import { RouteController } from '../../modules/catalog/presentation/controllers/route-controller';
import { TrainController } from '../../modules/catalog/presentation/controllers/train-controller';
import { BookingController } from '../../modules/booking/presentation/controllers/booking-controller';
import { AnalyticsController } from '../../modules/analytics/presentation/controllers/analytics-controller';
import { createAuthRoutes } from './auth-routes';
import { createStationRoutes } from './station-routes';
import { createRouteRoutes } from './route-routes';
import { createTrainRoutes } from './train-routes';
import { createBookingRoutes } from './booking-routes';
import { createAnalyticsRoutes } from './analytics-routes';

interface Controllers {
  auth: AuthController;
  station: StationController;
  route: RouteController;
  train: TrainController;
  booking: BookingController;
  analytics: AnalyticsController;
}

export function createApiRouter(controllers: Controllers, authMiddleware: RequestHandler): Router {
  const router = Router();

  router.use('/auth', createAuthRoutes(controllers.auth));
  router.use('/stations', createStationRoutes(controllers.station, authMiddleware));
  router.use('/routes', createRouteRoutes(controllers.route, authMiddleware));
  router.use('/trains', createTrainRoutes(controllers.train, authMiddleware));
  router.use('/bookings', createBookingRoutes(controllers.booking, authMiddleware));
  router.use('/analytics', createAnalyticsRoutes(controllers.analytics, authMiddleware));

  return router;
}
