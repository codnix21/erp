import { FastifyInstance } from 'fastify';
import { OrderController } from '../controllers/order.controller';
import { OrderService } from '../services/order.service';
import { authenticate, requireAuth, requireCompany } from '../middleware/auth';

export async function orderRoutes(fastify: FastifyInstance) {
  const orderService = new OrderService();
  const orderController = new OrderController(orderService);

  // Все маршруты требуют аутентификации и контекста компании
  const preHandler = [authenticate, requireAuth, requireCompany()];

  fastify.post('/orders', {
    preHandler,
  }, orderController.create.bind(orderController));

  fastify.get('/orders', {
    preHandler,
  }, orderController.getAll.bind(orderController));

  fastify.get('/orders/:id', {
    preHandler,
  }, orderController.getOne.bind(orderController));

  fastify.put('/orders/:id', {
    preHandler,
  }, orderController.update.bind(orderController));

  fastify.delete('/orders/:id', {
    preHandler,
  }, orderController.delete.bind(orderController));
}

