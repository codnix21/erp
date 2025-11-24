import { FastifyRequest, FastifyReply } from 'fastify';
import { CompanyService } from '../services/company.service';
import { createCompanySchema, updateCompanySchema, getCompaniesSchema } from '../validators/companies';
import { AuthenticatedRequest } from '../types/auth';
import logger from '../config/logger';

export class CompanyController {
  constructor(private companyService: CompanyService) {}

  async create(request: FastifyRequest, reply: FastifyReply) {
    try {
      const req = request as AuthenticatedRequest;
      const body = createCompanySchema.parse(request.body);
      const company = await this.companyService.createCompany(body, req.user.id);
      reply.code(201).send({ success: true, data: company });
    } catch (error: any) {
      logger.error('Create company error', { error: error.message });
      reply.code(400).send({
        success: false,
        error: { code: 'COMPANY_CREATE_FAILED', message: error.message },
      });
    }
  }

  async getOne(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { id } = request.params as { id: string };
      const company = await this.companyService.getCompany(id);
      reply.send({ success: true, data: company });
    } catch (error: any) {
      logger.error('Get company error', { error: error.message });
      reply.code(404).send({
        success: false,
        error: { code: 'COMPANY_NOT_FOUND', message: error.message },
      });
    }
  }

  async getAll(request: FastifyRequest, reply: FastifyReply) {
    try {
      const req = request as AuthenticatedRequest;
      const { query } = getCompaniesSchema.parse(request);
      const isAdmin = req.user.roles?.includes('Admin') || false;
      const result = await this.companyService.getCompanies(
        req.user.id,
        query.page,
        query.limit,
        { search: query.search },
        isAdmin
      );
      reply.send({ success: true, data: result.data, meta: result.meta });
    } catch (error: any) {
      logger.error('Get companies error', { error: error.message });
      reply.code(400).send({
        success: false,
        error: { code: 'COMPANIES_FETCH_FAILED', message: error.message },
      });
    }
  }

  async update(request: FastifyRequest, reply: FastifyReply) {
    try {
      const req = request as AuthenticatedRequest;
      const { params, body } = updateCompanySchema.parse(request);
      const company = await this.companyService.updateCompany(
        params.id,
        body,
        req.user.id
      );
      reply.send({ success: true, data: company });
    } catch (error: any) {
      logger.error('Update company error', { error: error.message });
      reply.code(400).send({
        success: false,
        error: { code: 'COMPANY_UPDATE_FAILED', message: error.message },
      });
    }
  }

  async delete(request: FastifyRequest, reply: FastifyReply) {
    try {
      const req = request as AuthenticatedRequest;
      const { id } = request.params as { id: string };
      await this.companyService.deleteCompany(id, req.user.id);
      reply.send({ success: true, message: 'Company deleted successfully' });
    } catch (error: any) {
      logger.error('Delete company error', { error: error.message });
      reply.code(400).send({
        success: false,
        error: { code: 'COMPANY_DELETE_FAILED', message: error.message },
      });
    }
  }
}

