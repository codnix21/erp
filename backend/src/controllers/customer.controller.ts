import { FastifyRequest, FastifyReply } from 'fastify';
import { CustomerService } from '../services/customer.service';
import { createCustomerSchema, updateCustomerSchema, getCustomersSchema } from '../validators/customers';
import { AuthenticatedRequest } from '../types/auth';
import logger from '../config/logger';

export class CustomerController {
  constructor(private customerService: CustomerService) {}

  async create(request: FastifyRequest, reply: FastifyReply) {
    try {
      const req = request as AuthenticatedRequest;
      const body = createCustomerSchema.parse(request.body);

      if (!req.user?.companyId) {
        reply.code(400).send({
          success: false,
          error: { code: 'COMPANY_REQUIRED', message: 'Company context is required' },
        });
        return;
      }

      const customer = await this.customerService.createCustomer(
        body,
        req.user.companyId,
        req.user.id
      );

      reply.code(201).send({ success: true, data: customer });
    } catch (error: any) {
      logger.error('Create customer error', { error: error.message });
      reply.code(400).send({
        success: false,
        error: { code: 'CUSTOMER_CREATE_FAILED', message: error.message || 'Failed to create customer' },
      });
    }
  }

  async getOne(request: FastifyRequest, reply: FastifyReply) {
    try {
      const req = request as AuthenticatedRequest;
      const { id } = request.params as { id: string };

      if (!req.user?.companyId) {
        reply.code(400).send({
          success: false,
          error: { code: 'COMPANY_REQUIRED', message: 'Company context is required' },
        });
        return;
      }

      const customer = await this.customerService.getCustomer(id, req.user.companyId);
      reply.send({ success: true, data: customer });
    } catch (error: any) {
      logger.error('Get customer error', { error: error.message });
      reply.code(404).send({
        success: false,
        error: { code: 'CUSTOMER_NOT_FOUND', message: error.message || 'Customer not found' },
      });
    }
  }

  async getAll(request: FastifyRequest, reply: FastifyReply) {
    try {
      const req = request as AuthenticatedRequest;
      const { query } = getCustomersSchema.parse(request);

      if (!req.user?.companyId) {
        reply.code(400).send({
          success: false,
          error: { code: 'COMPANY_REQUIRED', message: 'Company context is required' },
        });
        return;
      }

      const result = await this.customerService.getCustomers(
        req.user.companyId,
        query.page,
        query.limit,
        { search: query.search }
      );

      reply.send({ success: true, data: result.data, meta: result.meta });
    } catch (error: any) {
      logger.error('Get customers error', { error: error.message, stack: error.stack });
      reply.code(400).send({
        success: false,
        error: { code: 'CUSTOMERS_FETCH_FAILED', message: error.message || 'Failed to fetch customers' },
      });
    }
  }

  async update(request: FastifyRequest, reply: FastifyReply) {
    try {
      const req = request as AuthenticatedRequest;
      const { params, body } = updateCustomerSchema.parse(request);

      if (!req.user?.companyId) {
        reply.code(400).send({
          success: false,
          error: { code: 'COMPANY_REQUIRED', message: 'Company context is required' },
        });
        return;
      }

      const customer = await this.customerService.updateCustomer(
        params.id,
        body,
        req.user.companyId,
        req.user.id
      );

      reply.send({ success: true, data: customer });
    } catch (error: any) {
      logger.error('Update customer error', { error: error.message });
      reply.code(400).send({
        success: false,
        error: { code: 'CUSTOMER_UPDATE_FAILED', message: error.message || 'Failed to update customer' },
      });
    }
  }

  async delete(request: FastifyRequest, reply: FastifyReply) {
    try {
      const req = request as AuthenticatedRequest;
      const { id } = request.params as { id: string };

      if (!req.user?.companyId) {
        reply.code(400).send({
          success: false,
          error: { code: 'COMPANY_REQUIRED', message: 'Company context is required' },
        });
        return;
      }

      await this.customerService.deleteCustomer(id, req.user.companyId, req.user.id);
      reply.send({ success: true, message: 'Customer deleted successfully' });
    } catch (error: any) {
      logger.error('Delete customer error', { error: error.message });
      reply.code(400).send({
        success: false,
        error: { code: 'CUSTOMER_DELETE_FAILED', message: error.message || 'Failed to delete customer' },
      });
    }
  }
}

