import { FastifyInstance } from 'fastify';
import { SupplierController } from '../controllers/supplier.controller';
import { SupplierService } from '../services/supplier.service';
import { authenticate, requireAuth, requireCompany } from '../middleware/auth';

export async function supplierRoutes(fastify: FastifyInstance) {
  const supplierService = new SupplierService();
  const supplierController = new SupplierController(supplierService);
  const preHandler = [authenticate, requireAuth, requireCompany()];

  fastify.post('/suppliers', { preHandler }, supplierController.create.bind(supplierController));
  fastify.get('/suppliers', { preHandler }, supplierController.getAll.bind(supplierController));
  fastify.get('/suppliers/:id', { preHandler }, supplierController.getOne.bind(supplierController));
  fastify.put('/suppliers/:id', { preHandler }, supplierController.update.bind(supplierController));
  fastify.delete('/suppliers/:id', { preHandler }, supplierController.delete.bind(supplierController));
}

