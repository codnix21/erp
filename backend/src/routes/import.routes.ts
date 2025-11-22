import { FastifyInstance } from 'fastify';
import { ImportController } from '../controllers/import.controller';
import { authenticate, requireAuth, requireCompany } from '../middleware/auth';

const importController = new ImportController();

export async function importRoutes(fastify: FastifyInstance) {
  const preHandler = [authenticate, requireAuth, requireCompany()];

  fastify.post(
    '/products/excel',
    { preHandler },
    importController.importProductsFromExcel.bind(importController)
  );
}

