import { FastifyRequest, FastifyReply } from 'fastify';
import { WarehouseService } from '../services/warehouse.service';
import { createWarehouseSchema, updateWarehouseSchema, getWarehousesSchema } from '../validators/warehouses';
import { AuthenticatedRequest } from '../types/auth';
import logger from '../config/logger';

export class WarehouseController {
  constructor(private warehouseService: WarehouseService) {}

  async create(request: FastifyRequest, reply: FastifyReply) {
    try {
      const req = request as AuthenticatedRequest;
      const body = createWarehouseSchema.parse(request.body);
      if (!req.user?.companyId) {
        return reply.code(400).send({
          success: false,
          error: { code: 'COMPANY_REQUIRED', message: 'Company context is required' },
        });
      }
      const warehouse = await this.warehouseService.createWarehouse(
        body,
        req.user.companyId,
        req.user.id
      );
      reply.code(201).send({ success: true, data: warehouse });
    } catch (error: any) {
      logger.error('Create warehouse error', { error: error.message });
      reply.code(400).send({
        success: false,
        error: { code: 'WAREHOUSE_CREATE_FAILED', message: error.message },
      });
    }
  }

  async getOne(request: FastifyRequest, reply: FastifyReply) {
    try {
      const req = request as AuthenticatedRequest;
      const { id } = request.params as { id: string };
      if (!req.user?.companyId) {
        return reply.code(400).send({
          success: false,
          error: { code: 'COMPANY_REQUIRED', message: 'Company context is required' },
        });
      }
      const warehouse = await this.warehouseService.getWarehouse(id, req.user.companyId);
      reply.send({ success: true, data: warehouse });
    } catch (error: any) {
      logger.error('Get warehouse error', { error: error.message });
      reply.code(404).send({
        success: false,
        error: { code: 'WAREHOUSE_NOT_FOUND', message: error.message },
      });
    }
  }

  async getAll(request: FastifyRequest, reply: FastifyReply) {
    try {
      const req = request as AuthenticatedRequest;
      const { query } = getWarehousesSchema.parse(request);
      if (!req.user?.companyId) {
        return reply.code(400).send({
          success: false,
          error: { code: 'COMPANY_REQUIRED', message: 'Company context is required' },
        });
      }
      const result = await this.warehouseService.getWarehouses(
        req.user.companyId,
        query.page,
        query.limit,
        { search: query.search }
      );
      reply.send({ success: true, data: result.data, meta: result.meta });
    } catch (error: any) {
      logger.error('Get warehouses error', { error: error.message });
      reply.code(400).send({
        success: false,
        error: { code: 'WAREHOUSES_FETCH_FAILED', message: error.message },
      });
    }
  }

  async update(request: FastifyRequest, reply: FastifyReply) {
    try {
      const req = request as AuthenticatedRequest;
      const { params, body } = updateWarehouseSchema.parse(request);
      if (!req.user?.companyId) {
        return reply.code(400).send({
          success: false,
          error: { code: 'COMPANY_REQUIRED', message: 'Company context is required' },
        });
      }
      const warehouse = await this.warehouseService.updateWarehouse(
        params.id,
        body,
        req.user.companyId,
        req.user.id
      );
      reply.send({ success: true, data: warehouse });
    } catch (error: any) {
      logger.error('Update warehouse error', { error: error.message });
      reply.code(400).send({
        success: false,
        error: { code: 'WAREHOUSE_UPDATE_FAILED', message: error.message },
      });
    }
  }

  async delete(request: FastifyRequest, reply: FastifyReply) {
    try {
      const req = request as AuthenticatedRequest;
      const { id } = request.params as { id: string };
      if (!req.user?.companyId) {
        return reply.code(400).send({
          success: false,
          error: { code: 'COMPANY_REQUIRED', message: 'Company context is required' },
        });
      }
      await this.warehouseService.deleteWarehouse(id, req.user.companyId, req.user.id);
      reply.send({ success: true, message: 'Warehouse deleted successfully' });
    } catch (error: any) {
      logger.error('Delete warehouse error', { error: error.message });
      reply.code(400).send({
        success: false,
        error: { code: 'WAREHOUSE_DELETE_FAILED', message: error.message },
      });
    }
  }
}

