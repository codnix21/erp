import { FastifyInstance } from 'fastify';
import { UserController } from '../controllers/user.controller';
import { UserService } from '../services/user.service';
import { authenticate, requireAuth, requireRole } from '../middleware/auth';

export async function userRoutes(fastify: FastifyInstance) {
  const userService = new UserService();
  const userController = new UserController(userService);

  // Только админы могут управлять пользователями
  const preHandler = [authenticate, requireAuth, requireRole('Admin')];

  fastify.post('/users', { preHandler }, userController.create.bind(userController));
  fastify.get('/users', { preHandler }, userController.getAll.bind(userController));
  fastify.get('/users/:id', { preHandler }, userController.getOne.bind(userController));
  fastify.put('/users/:id', { preHandler }, userController.update.bind(userController));
  fastify.delete('/users/:id', { preHandler }, userController.delete.bind(userController));
  fastify.post('/users/:id/assign-role', { preHandler }, userController.assignRole.bind(userController));
  fastify.delete('/users/:id/roles/:roleId', { preHandler }, userController.removeRole.bind(userController));
}

