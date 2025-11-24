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

      logger.info('Dashboard stats response', { 
        companyId, 
        statsKeys: Object.keys(stats || {}),
        hasStats: !!stats,
        statsType: typeof stats,
      });

      const response = {
        success: true,
        data: stats,
      };

      logger.info('Sending dashboard response', { 
        responseType: typeof response,
        responseKeys: Object.keys(response),
        dataType: typeof response.data,
      });

      reply.send(response);
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

