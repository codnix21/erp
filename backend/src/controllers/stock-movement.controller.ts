import { FastifyRequest, FastifyReply } from 'fastify';
import { StockMovementService } from '../services/stock-movement.service';
import { createStockMovementSchema, getStockMovementsSchema, getStockSchema } from '../validators/stock-movements';
import { AuthenticatedRequest } from '../types/auth';
import logger from '../config/logger';

export class StockMovementController {
  constructor(private stockMovementService: StockMovementService) {}

  async create(request: FastifyRequest, reply: FastifyReply) {
    try {
      const req = request as AuthenticatedRequest;
      const body = createStockMovementSchema.parse(request.body);
      if (!req.user?.companyId) {
        return reply.code(400).send({
          success: false,
          error: { code: 'COMPANY_REQUIRED', message: 'Company context is required' },
        });
      }
      const movement = await this.stockMovementService.createStockMovement(
        body,
        req.user.companyId,
        req.user.id
      );
      reply.code(201).send({ success: true, data: movement });
    } catch (error: any) {
      logger.error('Create stock movement error', { error: error.message });
      reply.code(400).send({
        success: false,
        error: { code: 'STOCK_MOVEMENT_CREATE_FAILED', message: error.message },
      });
    }
  }

  async getAll(request: FastifyRequest, reply: FastifyReply) {
    try {
      const req = request as AuthenticatedRequest;
      const { query } = getStockMovementsSchema.parse(request);
      if (!req.user?.companyId) {
        return reply.code(400).send({
          success: false,
          error: { code: 'COMPANY_REQUIRED', message: 'Company context is required' },
        });
      }
      const result = await this.stockMovementService.getStockMovements(
        req.user.companyId,
        query.page,
        query.limit,
        {
          warehouseId: query.warehouseId,
          productId: query.productId,
          movementType: query.movementType,
          dateFrom: query.dateFrom,
          dateTo: query.dateTo,
        }
      );
      reply.send({ success: true, data: result.data, meta: result.meta });
    } catch (error: any) {
      logger.error('Get stock movements error', { error: error.message });
      reply.code(400).send({
        success: false,
        error: { code: 'STOCK_MOVEMENTS_FETCH_FAILED', message: error.message },
      });
    }
  }

  async getStock(request: FastifyRequest, reply: FastifyReply) {
    try {
      const req = request as AuthenticatedRequest;
      const { query } = getStockSchema.parse(request);
      if (!req.user?.companyId) {
        return reply.code(400).send({
          success: false,
          error: { code: 'COMPANY_REQUIRED', message: 'Company context is required' },
        });
      }
      const stock = await this.stockMovementService.getStock(req.user.companyId, {
        warehouseId: query.warehouseId,
        productId: query.productId,
      });
      reply.send({ success: true, data: stock });
    } catch (error: any) {
      logger.error('Get stock error', { error: error.message });
      reply.code(400).send({
        success: false,
        error: { code: 'STOCK_FETCH_FAILED', message: error.message },
      });
    }
  }

  async recalculateStock(request: FastifyRequest, reply: FastifyReply) {
    try {
      const req = request as AuthenticatedRequest;
      if (!req.user?.companyId) {
        return reply.code(400).send({
          success: false,
          error: { code: 'COMPANY_REQUIRED', message: 'Company context is required' },
        });
      }
      const result = await this.stockMovementService.recalculateStock(req.user.companyId);
      reply.send({ success: true, data: result });
    } catch (error: any) {
      logger.error('Recalculate stock error', { error: error.message });
      reply.code(400).send({
        success: false,
        error: { code: 'STOCK_RECALCULATE_FAILED', message: error.message },
      });
    }
  }
}

