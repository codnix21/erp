import bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { FastifyInstance } from 'fastify';
import jwt from 'jsonwebtoken';
import prisma from '../config/database';
import { JWTPayload, RefreshTokenPayload } from '../types/auth';
import logger from '../config/logger';
import { getEnv } from '../config/env';

export class AuthService {
  constructor(private fastify: FastifyInstance) {}

  async register(email: string, password: string, firstName?: string, lastName?: string) {
    // Проверка существования пользователя
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Хеширование пароля
    const passwordHash = await bcrypt.hash(password, 10);

    // Создание пользователя
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        createdAt: true,
      },
    });

    logger.info('User registered', { userId: user.id, email });

    return user;
  }

  async login(email: string, password: string) {
    // Поиск пользователя
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      logger.warn('Login attempt with non-existent email', { email });
      throw new Error('Invalid credentials');
    }

    if (!user.isActive) {
      logger.warn('Login attempt with inactive user', { email, userId: user.id });
      throw new Error('User account is inactive');
    }

    // Проверка пароля
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);

    if (!isValidPassword) {
      logger.warn('Login attempt with invalid password', { email, userId: user.id });
      throw new Error('Invalid credentials');
    }

    // Получаем все роли пользователя для первой активной компании
    const userCompany = await prisma.userCompanyRole.findFirst({
      where: {
        userId: user.id,
        isActive: true,
      },
      include: {
        company: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    const companyId = userCompany?.companyId;

    // Получаем все роли пользователя для этой компании
    const userRoles = companyId
      ? await prisma.userCompanyRole.findMany({
          where: {
            userId: user.id,
            companyId,
            isActive: true,
          },
          include: {
            role: true,
          },
        })
      : [];

    const roles = userRoles.map((ur) => ur.role.name);

    // Генерация токенов
    const tokens = await this.generateTokens(user.id, user.email);

    logger.info('User logged in', { userId: user.id, email, roles, companyId });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        companyId,
        roles,
      },
      ...tokens,
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      // Верификация refresh token с кастомным secret
      jwt.verify(refreshToken, getEnv().JWT_REFRESH_SECRET) as RefreshTokenPayload;

      // Проверка существования токена в БД
      const tokenRecord = await prisma.refreshToken.findUnique({
        where: { token: refreshToken },
        include: { user: true },
      });

      if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
        throw new Error('Invalid refresh token');
      }

      if (!tokenRecord.user.isActive) {
        throw new Error('User is inactive');
      }

      // Генерация новых токенов
      const tokens = await this.generateTokens(tokenRecord.user.id, tokenRecord.user.email);

      // Удаление старого refresh token (игнорируем ошибку, если токен уже удален - race condition)
      try {
        await prisma.refreshToken.delete({
          where: { id: tokenRecord.id },
        });
      } catch (deleteError: any) {
        // Игнорируем ошибку P2025 (Record to delete does not exist) - это может произойти при race condition
        // Также игнорируем ошибки, если запись уже была удалена другим запросом
        if (deleteError?.code !== 'P2025' && deleteError?.meta?.cause !== 'Record to delete does not exist') {
          logger.warn('Error deleting refresh token', { error: deleteError });
        }
        // Продолжаем выполнение даже если удаление не удалось
      }

      return tokens;
    } catch (error) {
      logger.error('Refresh token error', { error });
      throw new Error('Invalid refresh token');
    }
  }

  async logout(refreshToken: string) {
    await prisma.refreshToken.deleteMany({
      where: { token: refreshToken },
    });
  }

  private async generateTokens(userId: string, email: string) {
    // Получаем первую активную компанию пользователя
    const userCompany = await prisma.userCompanyRole.findFirst({
      where: {
        userId,
        isActive: true,
      },
      include: {
        company: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    const companyId = userCompany?.companyId;

    const payload: JWTPayload = {
      userId,
      email,
      companyId,
    };

    logger.info('Generating tokens', { userId, email, companyId });

    const refreshPayload: RefreshTokenPayload = {
      userId,
      tokenId: crypto.randomBytes(16).toString('hex'),
    };

    const accessToken = this.fastify.jwt.sign(payload, {
      expiresIn: getEnv().JWT_EXPIRES_IN,
    });

    // Используем jsonwebtoken для refresh token с отдельным secret
    const refreshToken = jwt.sign(
      refreshPayload,
      getEnv().JWT_REFRESH_SECRET,
      {
        expiresIn: getEnv().JWT_REFRESH_EXPIRES_IN,
      } as jwt.SignOptions
    );

    // Сохранение refresh token в БД
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 дней
      },
    });

    return {
      accessToken,
      refreshToken,
    };
  }
}

