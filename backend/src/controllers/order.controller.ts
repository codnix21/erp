import { FastifyRequest, FastifyReply } from 'fastify';
import { OrderService } from '../services/order.service';
import { createOrderSchema, updateOrderSchema, getOrdersSchema } from '../validators/orders';
import { AuthenticatedRequest } from '../types/auth';
import logger from '../config/logger';

export class OrderController {
  constructor(private orderService: OrderService) {}

  async create(request: FastifyRequest, reply: FastifyReply) {
    try {
      const req = request as AuthenticatedRequest;
      const { body } = createOrderSchema.parse(request);

      if (!req.user?.companyId) {
        reply.code(400).send({
          success: false,
          error: {
            code: 'COMPANY_REQUIRED',
            message: 'Company context is required',
          },
        });
        return;
      }

      const order = await this.orderService.createOrder(
        body,
        req.user.companyId,
        req.user.id
      );

      reply.code(201).send({
        success: true,
        data: order,
      });
    } catch (error: any) {
      logger.error('Create order error', { error });
      reply.code(400).send({
        success: false,
        error: {
          code: 'ORDER_CREATE_FAILED',
          message: error.message || 'Failed to create order',
        },
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
          error: {
            code: 'COMPANY_REQUIRED',
            message: 'Company context is required',
          },
        });
        return;
      }

      const order = await this.orderService.getOrder(id, req.user.companyId);

      reply.send({
        success: true,
        data: order,
      });
    } catch (error: any) {
      logger.error('Get order error', { error });
      reply.code(404).send({
        success: false,
        error: {
          code: 'ORDER_NOT_FOUND',
          message: error.message || 'Order not found',
        },
      });
    }
  }

  async getAll(request: FastifyRequest, reply: FastifyReply) {
    try {
      const req = request as AuthenticatedRequest;
      const { query } = getOrdersSchema.parse(request);

      if (!req.user?.companyId) {
        reply.code(400).send({
          success: false,
          error: {
            code: 'COMPANY_REQUIRED',
            message: 'Company context is required',
          },
        });
        return;
      }

      const result = await this.orderService.getOrders(
        req.user.companyId,
        query.page,
        query.limit,
        {
          status: query.status,
          customerId: query.customerId,
          supplierId: query.supplierId,
          search: query.search,
        }
      );

      reply.send({
        success: true,
        data: result.data,
        meta: result.meta,
      });
      logger.info('Response sent');
    } catch (error: any) {
      logger.error('Get orders error', { error, stack: error.stack });
      reply.code(400).send({
        success: false,
        error: {
          code: 'ORDERS_FETCH_FAILED',
          message: error.message || 'Failed to fetch orders',
        },
      });
    }
  }

  async update(request: FastifyRequest, reply: FastifyReply) {
    try {
      const req = request as AuthenticatedRequest;
      const { params, body } = updateOrderSchema.parse(request);

      if (!req.user?.companyId) {
        reply.code(400).send({
          success: false,
          error: {
            code: 'COMPANY_REQUIRED',
            message: 'Company context is required',
          },
        });
        return;
      }

      const order = await this.orderService.updateOrder(
        params.id,
        body,
        req.user.companyId,
        req.user.id
      );

      reply.send({
        success: true,
        data: order,
      });
    } catch (error: any) {
      logger.error('Update order error', { error });
      reply.code(400).send({
        success: false,
        error: {
          code: 'ORDER_UPDATE_FAILED',
          message: error.message || 'Failed to update order',
        },
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
          error: {
            code: 'COMPANY_REQUIRED',
            message: 'Company context is required',
          },
        });
        return;
      }

      await this.orderService.deleteOrder(id, req.user.companyId, req.user.id);

      reply.send({
        success: true,
        message: 'Order deleted successfully',
      });
    } catch (error: any) {
      logger.error('Delete order error', { error });
      reply.code(400).send({
        success: false,
        error: {
          code: 'ORDER_DELETE_FAILED',
          message: error.message || 'Failed to delete order',
        },
      });
    }
  }
}

