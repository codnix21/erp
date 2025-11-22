import { FastifyInstance } from 'fastify';
import { ExportController } from '../controllers/export.controller';
import { authenticate, requireAuth, requireCompany } from '../middleware/auth';

const exportController = new ExportController();

export async function exportRoutes(fastify: FastifyInstance) {
  const preHandler = [authenticate, requireAuth, requireCompany()];

  fastify.get(
    '/orders/excel',
    { preHandler },
    exportController.exportOrdersToExcel.bind(exportController)
  );

  fastify.get(
    '/products/excel',
    { preHandler },
    exportController.exportProductsToExcel.bind(exportController)
  );

  fastify.get(
    '/invoices/excel',
    { preHandler },
    exportController.exportInvoicesToExcel.bind(exportController)
  );

  fastify.get(
    '/orders/:id/pdf',
    { preHandler },
    exportController.exportOrderToPDF.bind(exportController)
  );

  fastify.get(
    '/invoices/:id/pdf',
    { preHandler },
    exportController.exportInvoiceToPDF.bind(exportController)
  );
}

