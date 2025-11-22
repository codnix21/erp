import { FastifyInstance } from 'fastify';
import { DashboardController } from '../controllers/dashboard.controller';
import { authenticate, requireAuth, requireCompany } from '../middleware/auth';

const dashboardController = new DashboardController();

export async function dashboardRoutes(fastify: FastifyInstance) {
  const preHandler = [authenticate, requireAuth, requireCompany()];

  fastify.get(
    '/stats',
    { preHandler },
    dashboardController.getStats.bind(dashboardController)
  );
}

