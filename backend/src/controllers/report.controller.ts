import { FastifyRequest, FastifyReply } from 'fastify';
import { ReportService } from '../services/report.service';
import { AuthenticatedRequest } from '../types/auth';

const reportService = new ReportService();

export class ReportController {
  async getSalesReport(request: FastifyRequest, reply: FastifyReply) {
    try {
      const req = request as AuthenticatedRequest;
      if (!req.user?.companyId) {
        reply.code(400).send({ error: { message: 'Company ID is required' } });
        return;
      }
      const { startDate, endDate } = request.query as any;

      const report = await reportService.getSalesReport(req.user.companyId, {
        startDate,
        endDate,
      });

      reply.send({ data: report });
    } catch (error: any) {
      reply.code(500).send({ error: { message: error.message } });
    }
  }

  async getPurchasesReport(request: FastifyRequest, reply: FastifyReply) {
    try {
      const req = request as AuthenticatedRequest;
      if (!req.user?.companyId) {
        reply.code(400).send({ error: { message: 'Company ID is required' } });
        return;
      }
      const { startDate, endDate } = request.query as any;

      const report = await reportService.getPurchasesReport(req.user.companyId, {
        startDate,
        endDate,
      });

      reply.send({ data: report });
    } catch (error: any) {
      reply.code(500).send({ error: { message: error.message } });
    }
  }

  async getWarehouseReport(request: FastifyRequest, reply: FastifyReply) {
    try {
      const req = request as AuthenticatedRequest;
      if (!req.user?.companyId) {
        reply.code(400).send({ error: { message: 'Company ID is required' } });
        return;
      }
      const { warehouseId } = request.query as any;

      const report = await reportService.getWarehouseReport(
        req.user.companyId,
        warehouseId
      );

      reply.send({ data: report });
    } catch (error: any) {
      reply.code(500).send({ error: { message: error.message } });
    }
  }

  async getFinancialReport(request: FastifyRequest, reply: FastifyReply) {
    try {
      const req = request as AuthenticatedRequest;
      if (!req.user?.companyId) {
        reply.code(400).send({ error: { message: 'Company ID is required' } });
        return;
      }
      const { startDate, endDate } = request.query as any;

      const report = await reportService.getFinancialReport(req.user.companyId, {
        startDate,
        endDate,
      });

      reply.send({ data: report });
    } catch (error: any) {
      reply.code(500).send({ error: { message: error.message } });
    }
  }
}

