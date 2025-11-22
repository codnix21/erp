import { FastifyRequest, FastifyReply } from 'fastify';
import { DashboardService } from '../services/dashboard.service';
import { AuthenticatedRequest } from '../types/auth';
import logger from '../config/logger';

const dashboardService = new DashboardService();

export class DashboardController {
  async getStats(request: FastifyRequest, reply: FastifyReply) {
    try {
      const req = request as AuthenticatedRequest;
      const companyId = req.user?.companyId;

      if (!companyId) {
        reply.code(400).send({
          success: false,
          error: {
            code: 'COMPANY_REQUIRED',
            message: 'Company context is required',
          },
        });
        return;
      }

      const stats = await dashboardService.getStats(companyId);

      reply.send({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      logger.error('Dashboard stats error', { error });
      reply.code(500).send({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Failed to fetch dashboard stats',
        },
      });
    }
  }
}

