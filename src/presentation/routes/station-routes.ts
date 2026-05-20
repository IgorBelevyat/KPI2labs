import { Router, RequestHandler } from 'express';
import { StationController } from '../../modules/catalog/presentation/controllers/station-controller';
import { validateCreateStation, validateUpdateStation } from '../validators/station-validator';
import { adminMiddleware } from '../../shared/middlewares/admin-middleware';

export function createStationRoutes(controller: StationController, authMiddleware: RequestHandler): Router {
  const router = Router();

  router.get('/', controller.getAll);
  router.post('/', authMiddleware, adminMiddleware, validateCreateStation, controller.create);
  router.put('/:id', authMiddleware, adminMiddleware, validateUpdateStation, controller.update);
  router.delete('/:id', authMiddleware, adminMiddleware, controller.delete);

  return router;
}
