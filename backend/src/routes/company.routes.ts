import { FastifyInstance } from 'fastify';
import { CompanyController } from '../controllers/company.controller';
import { CompanyService } from '../services/company.service';
import { authenticate, requireAuth } from '../middleware/auth';

export async function companyRoutes(fastify: FastifyInstance) {
  const companyService = new CompanyService();
  const companyController = new CompanyController(companyService);
  const preHandler = [authenticate, requireAuth];

  fastify.post('/companies', { preHandler }, companyController.create.bind(companyController));
  fastify.get('/companies', { preHandler }, companyController.getAll.bind(companyController));
  fastify.get('/companies/:id', { preHandler }, companyController.getOne.bind(companyController));
  fastify.put('/companies/:id', { preHandler }, companyController.update.bind(companyController));
  fastify.delete('/companies/:id', { preHandler }, companyController.delete.bind(companyController));
}

