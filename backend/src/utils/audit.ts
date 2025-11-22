import prisma from '../config/database';
import { FastifyRequest } from 'fastify';

interface CreateAuditLogParams {
  companyId?: string | null;
  userId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  oldValues?: any;
  newValues?: any;
  request?: FastifyRequest;
}

export async function createAuditLog(params: CreateAuditLogParams) {
  const { companyId, userId, action, entityType, entityId, oldValues, newValues, request } = params;

  let ipAddress: string | undefined;
  let userAgent: string | undefined;

  if (request) {
    // Получаем IP адрес из различных источников
    const forwardedFor = request.headers['x-forwarded-for'];
    if (forwardedFor) {
      // x-forwarded-for может быть строкой или массивом
      ipAddress = Array.isArray(forwardedFor) 
        ? forwardedFor[0].split(',')[0].trim()
        : forwardedFor.split(',')[0].trim();
    } else if (request.ip) {
      ipAddress = request.ip;
    } else if (request.socket?.remoteAddress) {
      ipAddress = request.socket.remoteAddress;
    }
    
    userAgent = request.headers['user-agent'];
  }

  await prisma.auditLog.create({
    data: {
      companyId: companyId || null,
      userId: userId || null,
      action,
      entityType,
      entityId,
      oldValues: oldValues ? JSON.parse(JSON.stringify(oldValues)) : null,
      newValues: newValues ? JSON.parse(JSON.stringify(newValues)) : null,
      ipAddress,
      userAgent,
    },
  });
}

