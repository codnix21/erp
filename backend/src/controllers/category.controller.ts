import { FastifyRequest, FastifyReply } from 'fastify';
import { CategoryService } from '../services/category.service';
import { createCategorySchema, updateCategorySchema, getCategoriesSchema } from '../validators/categories';
import { AuthenticatedRequest } from '../types/auth';
import logger from '../config/logger';

export class CategoryController {
  constructor(private categoryService: CategoryService) {}

  async create(request: FastifyRequest, reply: FastifyReply) {
    try {
      const req = request as AuthenticatedRequest;
      const body = createCategorySchema.parse(request.body);
      if (!req.user?.companyId) {
        return reply.code(400).send({
          success: false,
          error: { code: 'COMPANY_REQUIRED', message: 'Company context is required' },
        });
      }
      const category = await this.categoryService.createCategory(
        body,
        req.user.companyId,
        req.user.id
      );
      reply.code(201).send({ success: true, data: category });
    } catch (error: any) {
      logger.error('Create category error', { error: error.message });
      reply.code(400).send({
        success: false,
        error: { code: 'CATEGORY_CREATE_FAILED', message: error.message },
      });
    }
  }

  async getOne(request: FastifyRequest, reply: FastifyReply) {
    try {
      const req = request as AuthenticatedRequest;
      const { id } = request.params as { id: string };
      if (!req.user?.companyId) {
        return reply.code(400).send({
          success: false,
          error: { code: 'COMPANY_REQUIRED', message: 'Company context is required' },
        });
      }
      const category = await this.categoryService.getCategory(id, req.user.companyId);
      reply.send({ success: true, data: category });
    } catch (error: any) {
      logger.error('Get category error', { error: error.message });
      reply.code(404).send({
        success: false,
        error: { code: 'CATEGORY_NOT_FOUND', message: error.message },
      });
    }
  }

  async getAll(request: FastifyRequest, reply: FastifyReply) {
    try {
      const req = request as AuthenticatedRequest;
      const { query } = getCategoriesSchema.parse(request);
      if (!req.user?.companyId) {
        return reply.code(400).send({
          success: false,
          error: { code: 'COMPANY_REQUIRED', message: 'Company context is required' },
        });
      }
      const categories = await this.categoryService.getCategories(req.user.companyId, {
        parentId: query.parentId,
        search: query.search,
      });
      reply.send({ success: true, data: categories });
    } catch (error: any) {
      logger.error('Get categories error', { error: error.message });
      reply.code(400).send({
        success: false,
        error: { code: 'CATEGORIES_FETCH_FAILED', message: error.message },
      });
    }
  }

  async update(request: FastifyRequest, reply: FastifyReply) {
    try {
      const req = request as AuthenticatedRequest;
      const { params, body } = updateCategorySchema.parse(request);
      if (!req.user?.companyId) {
        return reply.code(400).send({
          success: false,
          error: { code: 'COMPANY_REQUIRED', message: 'Company context is required' },
        });
      }
      const category = await this.categoryService.updateCategory(
        params.id,
        body,
        req.user.companyId,
        req.user.id
      );
      reply.send({ success: true, data: category });
    } catch (error: any) {
      logger.error('Update category error', { error: error.message });
      reply.code(400).send({
        success: false,
        error: { code: 'CATEGORY_UPDATE_FAILED', message: error.message },
      });
    }
  }

  async delete(request: FastifyRequest, reply: FastifyReply) {
    try {
      const req = request as AuthenticatedRequest;
      const { id } = request.params as { id: string };
      if (!req.user?.companyId) {
        return reply.code(400).send({
          success: false,
          error: { code: 'COMPANY_REQUIRED', message: 'Company context is required' },
        });
      }
      await this.categoryService.deleteCategory(id, req.user.companyId, req.user.id);
      reply.send({ success: true, message: 'Category deleted successfully' });
    } catch (error: any) {
      logger.error('Delete category error', { error: error.message });
      reply.code(400).send({
        success: false,
        error: { code: 'CATEGORY_DELETE_FAILED', message: error.message },
      });
    }
  }
}

