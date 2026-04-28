import { Router, RequestHandler } from 'express';
import { TrainController } from '../controllers/train-controller';
import { validateCreateTrain, validateUpdateTrain, validateAddCarriage } from '../validators/train-validator';
import { adminMiddleware } from '../middleware/admin-middleware';

export function createTrainRoutes(controller: TrainController, authMiddleware: RequestHandler): Router {
  const router = Router();

  router.get('/', controller.getAll);
  router.get('/search', controller.search);
  router.get('/:id/seats', controller.getAvailableSeats);
  router.post('/', authMiddleware, adminMiddleware, validateCreateTrain, controller.create);
  router.put('/:id', authMiddleware, adminMiddleware, validateUpdateTrain, controller.update);
  router.delete('/:id', authMiddleware, adminMiddleware, controller.delete);
  router.post('/:id/carriages', authMiddleware, adminMiddleware, validateAddCarriage, controller.addCarriage);

  return router;
}
