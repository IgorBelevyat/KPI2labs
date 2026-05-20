import { Router, RequestHandler } from 'express';
import { AnalyticsController } from '../../modules/analytics/presentation/controllers/analytics-controller';
import { adminMiddleware } from '../../shared/middlewares/admin-middleware';

export function createAnalyticsRoutes(controller: AnalyticsController, authMiddleware: RequestHandler): Router {
  const router = Router();
  router.get('/stats', authMiddleware, adminMiddleware, controller.getAllStats);
  return router;
}
