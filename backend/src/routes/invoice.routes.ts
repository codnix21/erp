import { FastifyInstance } from 'fastify';
import { InvoiceController } from '../controllers/invoice.controller';
import { InvoiceService } from '../services/invoice.service';
import { authenticate, requireAuth, requireCompany } from '../middleware/auth';

export async function invoiceRoutes(fastify: FastifyInstance) {
  const invoiceService = new InvoiceService();
  const invoiceController = new InvoiceController(invoiceService);
  const preHandler = [authenticate, requireAuth, requireCompany()];

  fastify.post('/invoices', { preHandler }, invoiceController.create.bind(invoiceController));
  fastify.get('/invoices', { preHandler }, invoiceController.getAll.bind(invoiceController));
  fastify.get('/invoices/:id', { preHandler }, invoiceController.getOne.bind(invoiceController));
  fastify.put('/invoices/:id', { preHandler }, invoiceController.update.bind(invoiceController));
  fastify.delete('/invoices/:id', { preHandler }, invoiceController.delete.bind(invoiceController));
}

