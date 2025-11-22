import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthenticatedRequest } from '../types/auth';
import prisma from '../config/database';

/**
 * Middleware для автоматической фильтрации по company_id
 * Добавляет companyId в query параметры для всех запросов
 */
export async function companyScope(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const req = request as AuthenticatedRequest;
  
  if (!req.user?.companyId) {
    return;
  }

  // Добавляем companyId в query параметры
  if (request.query && typeof request.query === 'object') {
    (request.query as any).companyId = req.user.companyId;
  }

  // Для body запросов также добавляем companyId
  if (request.body && typeof request.body === 'object') {
    (request.body as any).companyId = req.user.companyId;
  }

  // Для params можно добавить проверку, если нужно
}

/**
 * Проверка доступа к ресурсу компании
 */
export async function checkCompanyAccess(
  companyId: string,
  userCompanyId: string
): Promise<boolean> {
  if (companyId !== userCompanyId) {
    return false;
  }
  return true;
}

/**
 * Получение ресурса с проверкой доступа к компании
 */
export async function getResourceWithCompanyCheck<T>(
  model: any,
  id: string,
  userCompanyId: string
): Promise<T | null> {
  const resource = await model.findUnique({
    where: { id },
  });

  if (!resource) {
    return null;
  }

  if (resource.companyId !== userCompanyId) {
    return null;
  }

  return resource;
}

