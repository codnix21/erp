import { FastifyInstance } from 'fastify';
import { ReportController } from '../controllers/report.controller';
import { authenticate, requireAuth, requireCompany } from '../middleware/auth';

const reportController = new ReportController();

export async function reportRoutes(fastify: FastifyInstance) {
  const preHandler = [authenticate, requireAuth, requireCompany()];

  fastify.get(
    '/sales',
    { preHandler },
    reportController.getSalesReport.bind(reportController)
  );

  fastify.get(
    '/purchases',
    { preHandler },
    reportController.getPurchasesReport.bind(reportController)
  );

  fastify.get(
    '/warehouse',
    { preHandler },
    reportController.getWarehouseReport.bind(reportController)
  );

  fastify.get(
    '/financial',
    { preHandler },
    reportController.getFinancialReport.bind(reportController)
  );
}

