import { FastifyInstance } from 'fastify';
import { authenticate, requireAuth, requireRole } from '../middleware/auth';
import prisma from '../config/database';

export default async function roleRoutes(fastify: FastifyInstance) {
  // Только админы могут просматривать роли
  const preHandler = [authenticate, requireAuth, requireRole('Admin')];

  fastify.get('/roles', { preHandler }, async (request, reply) => {
    try {
      const roles = await prisma.role.findMany({
        orderBy: { name: 'asc' },
      });

      reply.send({
        success: true,
        data: roles,
      });
    } catch (error: any) {
      reply.code(500).send({
        success: false,
        error: {
          code: 'ROLES_FETCH_FAILED',
          message: error.message || 'Failed to fetch roles',
        },
      });
    }
  });
}

