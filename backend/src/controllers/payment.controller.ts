import { FastifyRequest, FastifyReply } from 'fastify';
import { PaymentService } from '../services/payment.service';
import { createPaymentSchema, updatePaymentSchema, getPaymentsSchema } from '../validators/payments';
import { AuthenticatedRequest } from '../types/auth';
import logger from '../config/logger';

export class PaymentController {
  constructor(private paymentService: PaymentService) {}

  async create(request: FastifyRequest, reply: FastifyReply) {
    try {
      const req = request as AuthenticatedRequest;
      const body = createPaymentSchema.parse(request.body);
      if (!req.user?.companyId) {
        return reply.code(400).send({
          success: false,
          error: { code: 'COMPANY_REQUIRED', message: 'Company context is required' },
        });
      }
      const payment = await this.paymentService.createPayment(
        body,
        req.user.companyId,
        req.user.id,
        request
      );
      reply.code(201).send({ success: true, data: payment });
    } catch (error: any) {
      logger.error('Create payment error', { error: error.message });
      reply.code(400).send({
        success: false,
        error: { code: 'PAYMENT_CREATE_FAILED', message: error.message },
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
      const payment = await this.paymentService.getPayment(id, req.user.companyId);
      reply.send({ success: true, data: payment });
    } catch (error: any) {
      logger.error('Get payment error', { error: error.message });
      reply.code(404).send({
        success: false,
        error: { code: 'PAYMENT_NOT_FOUND', message: error.message },
      });
    }
  }

  async getAll(request: FastifyRequest, reply: FastifyReply) {
    try {
      const req = request as AuthenticatedRequest;
      const { query } = getPaymentsSchema.parse(request);
      if (!req.user?.companyId) {
        return reply.code(400).send({
          success: false,
          error: { code: 'COMPANY_REQUIRED', message: 'Company context is required' },
        });
      }
      const result = await this.paymentService.getPayments(
        req.user.companyId,
        query.page,
        query.limit,
        {
          invoiceId: query.invoiceId,
          paymentDateFrom: query.paymentDateFrom,
          paymentDateTo: query.paymentDateTo,
        }
      );
      reply.send({ success: true, data: result.data, meta: result.meta });
    } catch (error: any) {
      logger.error('Get payments error', { error: error.message });
      reply.code(400).send({
        success: false,
        error: { code: 'PAYMENTS_FETCH_FAILED', message: error.message },
      });
    }
  }

  async update(request: FastifyRequest, reply: FastifyReply) {
    try {
      const req = request as AuthenticatedRequest;
      const { params, body } = updatePaymentSchema.parse(request);
      if (!req.user?.companyId) {
        return reply.code(400).send({
          success: false,
          error: { code: 'COMPANY_REQUIRED', message: 'Company context is required' },
        });
      }
      const payment = await this.paymentService.updatePayment(
        params.id,
        body,
        req.user.companyId,
        req.user.id
      );
      reply.send({ success: true, data: payment });
    } catch (error: any) {
      logger.error('Update payment error', { error: error.message });
      reply.code(400).send({
        success: false,
        error: { code: 'PAYMENT_UPDATE_FAILED', message: error.message },
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
      await this.paymentService.deletePayment(id, req.user.companyId, req.user.id);
      reply.send({ success: true, message: 'Payment deleted successfully' });
    } catch (error: any) {
      logger.error('Delete payment error', { error: error.message });
      reply.code(400).send({
        success: false,
        error: { code: 'PAYMENT_DELETE_FAILED', message: error.message },
      });
    }
  }
}

