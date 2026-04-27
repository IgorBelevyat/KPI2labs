import { Router, RequestHandler } from 'express';
import { StationController } from '../controllers/station-controller';
import { validateCreateStation, validateUpdateStation } from '../validators/station-validator';
import { adminMiddleware } from '../middleware/admin-middleware';

export function createStationRoutes(controller: StationController, authMiddleware: RequestHandler): Router {
  const router = Router();

  router.get('/', controller.getAll);
  router.post('/', authMiddleware, adminMiddleware, validateCreateStation, controller.create);
  router.put('/:id', authMiddleware, adminMiddleware, validateUpdateStation, controller.update);
  router.delete('/:id', authMiddleware, adminMiddleware, controller.delete);

  return router;
}
