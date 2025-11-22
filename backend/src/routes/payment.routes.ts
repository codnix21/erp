import { FastifyInstance } from 'fastify';
import { PaymentController } from '../controllers/payment.controller';
import { PaymentService } from '../services/payment.service';
import { authenticate, requireAuth, requireCompany } from '../middleware/auth';

export async function paymentRoutes(fastify: FastifyInstance) {
  const paymentService = new PaymentService();
  const paymentController = new PaymentController(paymentService);
  const preHandler = [authenticate, requireAuth, requireCompany()];

  fastify.post('/payments', { preHandler }, paymentController.create.bind(paymentController));
  fastify.get('/payments', { preHandler }, paymentController.getAll.bind(paymentController));
  fastify.get('/payments/:id', { preHandler }, paymentController.getOne.bind(paymentController));
  fastify.put('/payments/:id', { preHandler }, paymentController.update.bind(paymentController));
  fastify.delete('/payments/:id', { preHandler }, paymentController.delete.bind(paymentController));
}

