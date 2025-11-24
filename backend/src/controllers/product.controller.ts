import { FastifyRequest, FastifyReply } from 'fastify';
import { ProductService } from '../services/product.service';
import { createProductSchema, updateProductSchema, getProductsSchema } from '../validators/products';
import { AuthenticatedRequest } from '../types/auth';
import logger from '../config/logger';

export class ProductController {
  constructor(private productService: ProductService) {}

  async create(request: FastifyRequest, reply: FastifyReply) {
    try {
      const req = request as AuthenticatedRequest;
      const body = createProductSchema.parse(request.body);

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

      const product = await this.productService.createProduct(
        body.body,
        req.user.companyId,
        req.user.id
      );

      reply.code(201).send({
        success: true,
        data: product,
      });
    } catch (error: any) {
      logger.error('Create product error', { error: error.message });
      reply.code(400).send({
        success: false,
        error: {
          code: 'PRODUCT_CREATE_FAILED',
          message: error.message || 'Failed to create product',
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

      const product = await this.productService.getProduct(id, req.user.companyId);

      reply.send({
        success: true,
        data: product,
      });
    } catch (error: any) {
      logger.error('Get product error', { error: error.message });
      reply.code(404).send({
        success: false,
        error: {
          code: 'PRODUCT_NOT_FOUND',
          message: error.message || 'Product not found',
        },
      });
    }
  }

  async getAll(request: FastifyRequest, reply: FastifyReply) {
    try {
      const req = request as AuthenticatedRequest;
      const { query } = getProductsSchema.parse(request);

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

      const result = await this.productService.getProducts(
        req.user.companyId,
        query.page,
        query.limit,
        {
          categoryId: query.categoryId,
          search: query.search,
          isService: query.isService,
        }
      );

      reply.send({
        success: true,
        data: result.data,
        meta: result.meta,
      });
    } catch (error: any) {
      logger.error('Get products error', { error: error.message });
      reply.code(400).send({
        success: false,
        error: {
          code: 'PRODUCTS_FETCH_FAILED',
          message: error.message || 'Failed to fetch products',
        },
      });
    }
  }

  async update(request: FastifyRequest, reply: FastifyReply) {
    try {
      const req = request as AuthenticatedRequest;
      const { params, body } = updateProductSchema.parse(request);

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

      const product = await this.productService.updateProduct(
        params.id,
        body,
        req.user.companyId,
        req.user.id
      );

      reply.send({
        success: true,
        data: product,
      });
    } catch (error: any) {
      logger.error('Update product error', { error: error.message });
      reply.code(400).send({
        success: false,
        error: {
          code: 'PRODUCT_UPDATE_FAILED',
          message: error.message || 'Failed to update product',
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

      await this.productService.deleteProduct(id, req.user.companyId, req.user.id);

      reply.send({
        success: true,
        message: 'Product deleted successfully',
      });
    } catch (error: any) {
      logger.error('Delete product error', { error: error.message });
      reply.code(400).send({
        success: false,
        error: {
          code: 'PRODUCT_DELETE_FAILED',
          message: error.message || 'Failed to delete product',
        },
      });
    }
  }
}

