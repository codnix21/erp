import { FastifyInstance } from 'fastify';
import { WarehouseController } from '../controllers/warehouse.controller';
import { WarehouseService } from '../services/warehouse.service';
import { authenticate, requireAuth, requireCompany } from '../middleware/auth';

export async function warehouseRoutes(fastify: FastifyInstance) {
  const warehouseService = new WarehouseService();
  const warehouseController = new WarehouseController(warehouseService);
  const preHandler = [authenticate, requireAuth, requireCompany()];

  fastify.post('/warehouses', { preHandler }, warehouseController.create.bind(warehouseController));
  fastify.get('/warehouses', { preHandler }, warehouseController.getAll.bind(warehouseController));
  fastify.get('/warehouses/:id', { preHandler }, warehouseController.getOne.bind(warehouseController));
  fastify.put('/warehouses/:id', { preHandler }, warehouseController.update.bind(warehouseController));
  fastify.delete('/warehouses/:id', { preHandler }, warehouseController.delete.bind(warehouseController));
}

