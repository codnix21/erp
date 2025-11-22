import { FastifyInstance } from 'fastify';
import { CategoryController } from '../controllers/category.controller';
import { CategoryService } from '../services/category.service';
import { authenticate, requireAuth, requireCompany } from '../middleware/auth';

export async function categoryRoutes(fastify: FastifyInstance) {
  const categoryService = new CategoryService();
  const categoryController = new CategoryController(categoryService);
  const preHandler = [authenticate, requireAuth, requireCompany()];

  fastify.post('/categories', { preHandler }, categoryController.create.bind(categoryController));
  fastify.get('/categories', { preHandler }, categoryController.getAll.bind(categoryController));
  fastify.get('/categories/:id', { preHandler }, categoryController.getOne.bind(categoryController));
  fastify.put('/categories/:id', { preHandler }, categoryController.update.bind(categoryController));
  fastify.delete('/categories/:id', { preHandler }, categoryController.delete.bind(categoryController));
}

