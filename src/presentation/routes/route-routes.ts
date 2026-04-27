import { Router, RequestHandler } from 'express';
import { RouteController } from '../controllers/route-controller';
import { validateCreateRoute, validateUpdateRoute } from '../validators/route-validator';
import { adminMiddleware } from '../middleware/admin-middleware';

export function createRouteRoutes(controller: RouteController, authMiddleware: RequestHandler): Router {
  const router = Router();

  router.get('/', controller.getAll);
  router.post('/', authMiddleware, adminMiddleware, validateCreateRoute, controller.create);
  router.put('/:id', authMiddleware, adminMiddleware, validateUpdateRoute, controller.update);
  router.delete('/:id', authMiddleware, adminMiddleware, controller.delete);

  return router;
}
