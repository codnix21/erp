import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthenticatedRequest } from '../types/auth';
import prisma from '../config/database';
import logger from '../config/logger';

// Простой кэш ролей в памяти (TTL: 60 секунд)
interface RoleCacheEntry {
  roles: string[];
  expiresAt: number;
}

const roleCache = new Map<string, RoleCacheEntry>();
const ROLE_CACHE_TTL = 60 * 1000; // 60 секунд

function getCacheKey(userId: string, companyId: string): string {
  return `${userId}:${companyId}`;
}

function getCachedRoles(userId: string, companyId: string): string[] | null {
  const key = getCacheKey(userId, companyId);
  const entry = roleCache.get(key);
  
  if (entry && entry.expiresAt > Date.now()) {
    return entry.roles;
  }
  
  if (entry) {
    roleCache.delete(key); // Удаляем устаревшую запись
  }
  
  return null;
}

function setCachedRoles(userId: string, companyId: string, roles: string[]): void {
  const key = getCacheKey(userId, companyId);
  roleCache.set(key, {
    roles,
    expiresAt: Date.now() + ROLE_CACHE_TTL,
  });
}

export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    await request.jwtVerify();
    const decoded = (request as any).user;
    
    // Устанавливаем user в request
    (request as AuthenticatedRequest).user = {
      id: decoded.userId,
      email: decoded.email,
      companyId: decoded.companyId,
    };
  } catch (err) {
    logger.warn('JWT verification failed', { error: err });
    reply.code(401).send({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid or expired token',
      },
    });
  }
}

export async function requireAuth(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const req = request as AuthenticatedRequest;
  
  if (!req.user) {
    logger.warn('No user in request');
    reply.code(401).send({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      },
    });
    return;
  }

  // Загружаем роли пользователя для текущей компании (с кэшированием)
  if (req.user.companyId) {
    try {
      // Проверяем кэш
      const cachedRoles = getCachedRoles(req.user.id, req.user.companyId);
      
      if (cachedRoles) {
        req.user.roles = cachedRoles;
        // Не логируем для каждого запроса, чтобы не засорять логи
      } else {
        // Загружаем из БД только если нет в кэше
        logger.info('Loading user roles from DB', { userId: req.user.id, companyId: req.user.companyId });
        const userRoles = await prisma.userCompanyRole.findMany({
          where: {
            userId: req.user.id,
            companyId: req.user.companyId,
            isActive: true,
          },
          include: {
            role: true,
          },
        });

        req.user.roles = userRoles.map((ur) => ur.role.name);
        setCachedRoles(req.user.id, req.user.companyId, req.user.roles);
        logger.info('User roles loaded and cached', { roles: req.user.roles });
      }
    } catch (err) {
      logger.error('Error loading user roles', { error: err });
      // Не блокируем запрос, если не удалось загрузить роли
      req.user.roles = [];
    }
  } else {
    logger.warn('No companyId in user', { userId: req.user.id });
  }
}

export function requireRole(...allowedRoles: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const req = request as AuthenticatedRequest;
    
    if (!req.user?.roles) {
      reply.code(403).send({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Access denied',
        },
      });
      return;
    }

    const hasRole = req.user.roles.some((role) => allowedRoles.includes(role));
    
    if (!hasRole) {
      reply.code(403).send({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `Required role: ${allowedRoles.join(' or ')}`,
        },
      });
      return;
    }
  };
}

export function requireCompany() {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const req = request as AuthenticatedRequest;
    
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
  };
}

