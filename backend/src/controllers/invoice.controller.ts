import { FastifyRequest, FastifyReply } from 'fastify';
import { InvoiceService } from '../services/invoice.service';
import { createInvoiceSchema, updateInvoiceSchema, getInvoicesSchema } from '../validators/invoices';
import { AuthenticatedRequest } from '../types/auth';
import logger from '../config/logger';

export class InvoiceController {
  constructor(private invoiceService: InvoiceService) {}

  async create(request: FastifyRequest, reply: FastifyReply) {
    try {
      const req = request as AuthenticatedRequest;
      const body = createInvoiceSchema.parse(request.body);
      if (!req.user?.companyId) {
        return reply.code(400).send({
          success: false,
          error: { code: 'COMPANY_REQUIRED', message: 'Company context is required' },
        });
      }
      const invoice = await this.invoiceService.createInvoice(
        body,
        req.user.companyId,
        req.user.id
      );
      reply.code(201).send({ success: true, data: invoice });
    } catch (error: any) {
      logger.error('Create invoice error', { error: error.message });
      reply.code(400).send({
        success: false,
        error: { code: 'INVOICE_CREATE_FAILED', message: error.message },
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
      const invoice = await this.invoiceService.getInvoice(id, req.user.companyId);
      reply.send({ success: true, data: invoice });
    } catch (error: any) {
      logger.error('Get invoice error', { error: error.message });
      reply.code(404).send({
        success: false,
        error: { code: 'INVOICE_NOT_FOUND', message: error.message },
      });
    }
  }

  async getAll(request: FastifyRequest, reply: FastifyReply) {
    try {
      const req = request as AuthenticatedRequest;
      const { query } = getInvoicesSchema.parse(request);
      if (!req.user?.companyId) {
        return reply.code(400).send({
          success: false,
          error: { code: 'COMPANY_REQUIRED', message: 'Company context is required' },
        });
      }
      const result = await this.invoiceService.getInvoices(
        req.user.companyId,
        query.page,
        query.limit,
        {
          status: query.status,
          orderId: query.orderId,
          search: query.search,
        }
      );
      reply.send({ success: true, data: result.data, meta: result.meta });
    } catch (error: any) {
      logger.error('Get invoices error', { error: error.message });
      reply.code(400).send({
        success: false,
        error: { code: 'INVOICES_FETCH_FAILED', message: error.message },
      });
    }
  }

  async update(request: FastifyRequest, reply: FastifyReply) {
    try {
      const req = request as AuthenticatedRequest;
      const { params, body } = updateInvoiceSchema.parse(request);
      if (!req.user?.companyId) {
        return reply.code(400).send({
          success: false,
          error: { code: 'COMPANY_REQUIRED', message: 'Company context is required' },
        });
      }
      const invoice = await this.invoiceService.updateInvoice(
        params.id,
        body,
        req.user.companyId,
        req.user.id
      );
      reply.send({ success: true, data: invoice });
    } catch (error: any) {
      logger.error('Update invoice error', { error: error.message });
      reply.code(400).send({
        success: false,
        error: { code: 'INVOICE_UPDATE_FAILED', message: error.message },
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
      await this.invoiceService.deleteInvoice(id, req.user.companyId, req.user.id);
      reply.send({ success: true, message: 'Invoice deleted successfully' });
    } catch (error: any) {
      logger.error('Delete invoice error', { error: error.message });
      reply.code(400).send({
        success: false,
        error: { code: 'INVOICE_DELETE_FAILED', message: error.message },
      });
    }
  }
}

