import { FastifyInstance } from 'fastify';
import { ProductController } from '../controllers/product.controller';
import { ProductService } from '../services/product.service';
import { authenticate, requireAuth, requireCompany } from '../middleware/auth';

export async function productRoutes(fastify: FastifyInstance) {
  const productService = new ProductService();
  const productController = new ProductController(productService);

  const preHandler = [authenticate, requireAuth, requireCompany()];

  fastify.post('/products', {
    preHandler,
  }, productController.create.bind(productController));

  fastify.get('/products', {
    preHandler,
  }, productController.getAll.bind(productController));

  fastify.get('/products/:id', {
    preHandler,
  }, productController.getOne.bind(productController));

  fastify.put('/products/:id', {
    preHandler,
  }, productController.update.bind(productController));

  fastify.delete('/products/:id', {
    preHandler,
  }, productController.delete.bind(productController));
}

