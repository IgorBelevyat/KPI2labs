import { Router } from 'express';
import { AuthController } from '../controllers/auth-controller';
import { validateRegister, validateLogin, validateRefreshToken } from '../validators/auth-validator';

export function createAuthRoutes(controller: AuthController): Router {
  const router = Router();

  router.post('/register', validateRegister, controller.register);
  router.post('/login', validateLogin, controller.login);
  router.post('/refresh', validateRefreshToken, controller.refresh);

  return router;
}
