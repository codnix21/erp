import { FastifyInstance } from 'fastify';
import { CustomerController } from '../controllers/customer.controller';
import { CustomerService } from '../services/customer.service';
import { authenticate, requireAuth, requireCompany } from '../middleware/auth';

export async function customerRoutes(fastify: FastifyInstance) {
  const customerService = new CustomerService();
  const customerController = new CustomerController(customerService);

  const preHandler = [authenticate, requireAuth, requireCompany()];

  fastify.post('/customers', { preHandler }, customerController.create.bind(customerController));
  fastify.get('/customers', { preHandler }, customerController.getAll.bind(customerController));
  fastify.get('/customers/:id', { preHandler }, customerController.getOne.bind(customerController));
  fastify.put('/customers/:id', { preHandler }, customerController.update.bind(customerController));
  fastify.delete('/customers/:id', { preHandler }, customerController.delete.bind(customerController));
}

