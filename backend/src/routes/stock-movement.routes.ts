import { FastifyInstance } from 'fastify';
import { StockMovementController } from '../controllers/stock-movement.controller';
import { StockMovementService } from '../services/stock-movement.service';
import { authenticate, requireAuth, requireCompany } from '../middleware/auth';

export async function stockMovementRoutes(fastify: FastifyInstance) {
  const stockMovementService = new StockMovementService();
  const stockMovementController = new StockMovementController(stockMovementService);
  const preHandler = [authenticate, requireAuth, requireCompany()];

  fastify.post('/stock-movements', { preHandler }, stockMovementController.create.bind(stockMovementController));
  fastify.get('/stock-movements', { preHandler }, stockMovementController.getAll.bind(stockMovementController));
  fastify.get('/stock', { preHandler }, stockMovementController.getStock.bind(stockMovementController));
}

