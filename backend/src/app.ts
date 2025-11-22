import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import { loadEnv } from './config/env';
import logger from './config/logger';
import { authRoutes } from './routes/auth.routes';
import { orderRoutes } from './routes/order.routes';
import { productRoutes } from './routes/product.routes';
import { customerRoutes } from './routes/customer.routes';
import { supplierRoutes } from './routes/supplier.routes';
import { invoiceRoutes } from './routes/invoice.routes';
import { paymentRoutes } from './routes/payment.routes';
import { warehouseRoutes } from './routes/warehouse.routes';
import { stockMovementRoutes } from './routes/stock-movement.routes';
import { categoryRoutes } from './routes/category.routes';
import { companyRoutes } from './routes/company.routes';
import { exportRoutes } from './routes/export.routes';
import { importRoutes } from './routes/import.routes';
import { reportRoutes } from './routes/report.routes';
import { auditRoutes } from './routes/audit.routes';
import { dashboardRoutes } from './routes/dashboard.routes';
import { userRoutes } from './routes/user.routes';
import { JWTPayload } from './types/auth';

// Загрузка переменных окружения
const env = loadEnv();

// Создание Fastify приложения
const app = Fastify({
  logger: false, // Используем Winston вместо встроенного логгера
  requestIdLogLabel: 'reqId',
  disableRequestLogging: true,
  trustProxy: true, // Доверяем прокси для правильного получения IP адреса
});

// Регистрация плагинов
async function registerPlugins() {
  // CORS
  await app.register(cors, {
    origin: env.CORS_ORIGIN,
    credentials: true,
  });

  // Helmet для безопасности
  await app.register(helmet);

  // Rate limiting
  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  // JWT
  await app.register(jwt, {
    secret: env.JWT_SECRET,
  });

  // Multipart для загрузки файлов
  await app.register(require('@fastify/multipart'), {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB
    },
  });

  // Расширение типов для Fastify
  app.decorate('authenticate', async function (request: any, reply: any) {
    try {
      await request.jwtVerify();
      const decoded = request.user as JWTPayload;
      request.user = {
        id: decoded.userId,
        email: decoded.email,
        companyId: decoded.companyId,
      };
    } catch (err) {
      reply.send(err);
    }
  });
}

// Регистрация маршрутов
async function registerRoutes() {
  await app.register(authRoutes, { prefix: '/api/v1/auth' });
  await app.register(orderRoutes, { prefix: '/api/v1' });
  await app.register(productRoutes, { prefix: '/api/v1' });
  await app.register(customerRoutes, { prefix: '/api/v1' });
  await app.register(supplierRoutes, { prefix: '/api/v1' });
  await app.register(invoiceRoutes, { prefix: '/api/v1' });
  await app.register(paymentRoutes, { prefix: '/api/v1' });
  await app.register(warehouseRoutes, { prefix: '/api/v1' });
  await app.register(stockMovementRoutes, { prefix: '/api/v1' });
  await app.register(categoryRoutes, { prefix: '/api/v1' });
  await app.register(companyRoutes, { prefix: '/api/v1' });
  await app.register(exportRoutes, { prefix: '/api/v1/export' });
  await app.register(importRoutes, { prefix: '/api/v1/import' });
  await app.register(reportRoutes, { prefix: '/api/v1/reports' });
  await app.register(auditRoutes, { prefix: '/api/v1/audit-logs' });
  await app.register(dashboardRoutes, { prefix: '/api/v1/dashboard' });
  await app.register(userRoutes, { prefix: '/api/v1' });
  
  // Импорт и регистрация routes для ролей
  const roleRoutes = (await import('./routes/role.routes')).default;
  await app.register(roleRoutes, { prefix: '/api/v1' });
}

// Логирование всех входящих запросов
app.addHook('onRequest', async (request, reply) => {
  logger.info('Incoming request', {
    method: request.method,
    url: request.url,
    ip: request.ip,
    headers: {
      'user-agent': request.headers['user-agent'],
      'authorization': request.headers.authorization ? 'Bearer ***' : 'none',
      'origin': request.headers.origin,
    },
  });
});

// Health check
app.get('/health', async (request, reply) => {
  logger.info('Health check requested', { ip: request.ip });
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  };
});

// Обработка ошибок
app.setErrorHandler((error, request, reply) => {
  logger.error('Request error', {
    error: error.message,
    stack: error.stack,
    url: request.url,
    method: request.method,
  });

  reply.status(error.statusCode || 500).send({
    success: false,
    error: {
      code: error.code || 'INTERNAL_ERROR',
      message: error.message || 'Internal server error',
    },
  });
});

// Запуск сервера
async function start() {
  try {
    await registerPlugins();
    await registerRoutes();

    await app.listen({
      port: env.PORT,
      host: env.HOST,
    });

    logger.info(`Server listening on ${env.HOST}:${env.PORT}`);
  } catch (err) {
    logger.error('Server startup error', { error: err });
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await app.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await app.close();
  process.exit(0);
});

// Запуск
if (require.main === module) {
  start();
}

export default app;

