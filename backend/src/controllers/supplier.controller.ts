import { FastifyRequest, FastifyReply } from 'fastify';
import { SupplierService } from '../services/supplier.service';
import { createSupplierSchema, updateSupplierSchema, getSuppliersSchema } from '../validators/suppliers';
import { AuthenticatedRequest } from '../types/auth';
import logger from '../config/logger';

export class SupplierController {
  constructor(private supplierService: SupplierService) {}

  async create(request: FastifyRequest, reply: FastifyReply) {
    try {
      const req = request as AuthenticatedRequest;
      const body = createSupplierSchema.parse(request.body);
      if (!req.user?.companyId) {
        return reply.code(400).send({
          success: false,
          error: { code: 'COMPANY_REQUIRED', message: 'Company context is required' },
        });
      }
      const supplier = await this.supplierService.createSupplier(
        body,
        req.user.companyId,
        req.user.id
      );
      reply.code(201).send({ success: true, data: supplier });
    } catch (error: any) {
      logger.error('Create supplier error', { error: error.message });
      reply.code(400).send({
        success: false,
        error: { code: 'SUPPLIER_CREATE_FAILED', message: error.message },
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
      const supplier = await this.supplierService.getSupplier(id, req.user.companyId);
      reply.send({ success: true, data: supplier });
    } catch (error: any) {
      logger.error('Get supplier error', { error: error.message });
      reply.code(404).send({
        success: false,
        error: { code: 'SUPPLIER_NOT_FOUND', message: error.message },
      });
    }
  }

  async getAll(request: FastifyRequest, reply: FastifyReply) {
    try {
      const req = request as AuthenticatedRequest;
      const { query } = getSuppliersSchema.parse(request);
      if (!req.user?.companyId) {
        return reply.code(400).send({
          success: false,
          error: { code: 'COMPANY_REQUIRED', message: 'Company context is required' },
        });
      }
      const result = await this.supplierService.getSuppliers(
        req.user.companyId,
        query.page,
        query.limit,
        { search: query.search }
      );
      reply.send({ success: true, data: result.data, meta: result.meta });
    } catch (error: any) {
      logger.error('Get suppliers error', { error: error.message });
      reply.code(400).send({
        success: false,
        error: { code: 'SUPPLIERS_FETCH_FAILED', message: error.message },
      });
    }
  }

  async update(request: FastifyRequest, reply: FastifyReply) {
    try {
      const req = request as AuthenticatedRequest;
      const { params, body } = updateSupplierSchema.parse(request);
      if (!req.user?.companyId) {
        return reply.code(400).send({
          success: false,
          error: { code: 'COMPANY_REQUIRED', message: 'Company context is required' },
        });
      }
      const supplier = await this.supplierService.updateSupplier(
        params.id,
        body,
        req.user.companyId,
        req.user.id
      );
      reply.send({ success: true, data: supplier });
    } catch (error: any) {
      logger.error('Update supplier error', { error: error.message });
      reply.code(400).send({
        success: false,
        error: { code: 'SUPPLIER_UPDATE_FAILED', message: error.message },
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
      await this.supplierService.deleteSupplier(id, req.user.companyId, req.user.id);
      reply.send({ success: true, message: 'Supplier deleted successfully' });
    } catch (error: any) {
      logger.error('Delete supplier error', { error: error.message });
      reply.code(400).send({
        success: false,
        error: { code: 'SUPPLIER_DELETE_FAILED', message: error.message },
      });
    }
  }
}

