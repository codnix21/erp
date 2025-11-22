import { FastifyRequest, FastifyReply } from 'fastify';
import prisma from '../config/database';
import { AuthenticatedRequest } from '../types/auth';

export class AuditController {
  async getAuditLogs(request: FastifyRequest, reply: FastifyReply) {
    try {
      const req = request as AuthenticatedRequest;
      if (!req.user?.companyId) {
        reply.code(400).send({ error: { message: 'Company ID is required' } });
        return;
      }
      const {
        page = '1',
        limit = '50',
        entityType,
        action,
        startDate,
        endDate,
      } = request.query as any;

      const where: any = {
        companyId: req.user.companyId,
      };

      if (entityType) {
        where.entityType = entityType;
      }

      if (action) {
        where.action = action;
      }

      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) {
          where.createdAt.gte = new Date(startDate);
        }
        if (endDate) {
          where.createdAt.lte = new Date(endDate);
        }
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const take = parseInt(limit);

      const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
          where,
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take,
        }),
        prisma.auditLog.count({ where }),
      ]);

      reply.send({
        data: logs,
        meta: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      });
    } catch (error: any) {
      reply.code(500).send({ error: { message: error.message } });
    }
  }

  async getAuditLog(request: FastifyRequest, reply: FastifyReply) {
    try {
      const req = request as AuthenticatedRequest;
      if (!req.user?.companyId) {
        reply.code(400).send({ error: { message: 'Company ID is required' } });
        return;
      }
      const { id } = request.params as { id: string };

      const log = await prisma.auditLog.findFirst({
        where: {
          id,
          companyId: req.user.companyId,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      if (!log) {
        return reply.code(404).send({ error: { message: 'Audit log not found' } });
      }

      reply.send({ data: log });
    } catch (error: any) {
      reply.code(500).send({ error: { message: error.message } });
    }
  }
}

