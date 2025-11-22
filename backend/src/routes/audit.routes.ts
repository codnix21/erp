import { FastifyInstance } from 'fastify';
import { AuditController } from '../controllers/audit.controller';
import { authenticate, requireAuth, requireCompany } from '../middleware/auth';

const auditController = new AuditController();

export async function auditRoutes(fastify: FastifyInstance) {
  const preHandler = [authenticate, requireAuth, requireCompany()];

  fastify.get(
    '/',
    { preHandler },
    auditController.getAuditLogs.bind(auditController)
  );

  fastify.get(
    '/:id',
    { preHandler },
    auditController.getAuditLog.bind(auditController)
  );
}

