import { FastifyInstance } from 'fastify';
import { AuthController } from '../controllers/auth.controller';
import { AuthService } from '../services/auth.service';
import { authenticate, requireAuth } from '../middleware/auth';

export async function authRoutes(fastify: FastifyInstance) {
  const authService = new AuthService(fastify);
  const authController = new AuthController(authService);

  // Публичные маршруты
  fastify.post('/register', authController.register.bind(authController));
  fastify.post('/login', authController.login.bind(authController));
  fastify.post('/refresh', authController.refreshToken.bind(authController));
  fastify.post('/logout', authController.logout.bind(authController));

  // Защищённые маршруты
  fastify.get('/me', {
    preHandler: [authenticate, requireAuth],
  }, authController.me.bind(authController));
}

