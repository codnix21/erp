import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthService } from '../services/auth.service';
import { registerSchema, loginSchema, refreshTokenSchema } from '../validators/auth';
import logger from '../config/logger';

export class AuthController {
  constructor(private authService: AuthService) {}

  async register(request: FastifyRequest, reply: FastifyReply) {
    try {
      const body = registerSchema.parse(request.body);
      const user = await this.authService.register(
        body.email,
        body.password,
        body.firstName,
        body.lastName
      );

      reply.code(201).send({
        success: true,
        data: user,
      });
    } catch (error: any) {
      logger.error('Register error', { error });
      reply.code(400).send({
        success: false,
        error: {
          code: 'REGISTRATION_FAILED',
          message: error.message || 'Registration failed',
        },
      });
    }
  }

  async login(request: FastifyRequest, reply: FastifyReply) {
    try {
      const body = loginSchema.parse(request.body);
      const result = await this.authService.login(body.email, body.password);

      reply.send({
        success: true,
        data: result,
      });
    } catch (error: any) {
      const email = (request.body as any)?.email;
      logger.error('Login error', { 
        error: error.message || error,
        stack: error.stack,
        email 
      });
      reply.code(401).send({
        success: false,
        error: {
          code: 'LOGIN_FAILED',
          message: error.message || 'Invalid credentials',
        },
      });
    }
  }

  async refreshToken(request: FastifyRequest, reply: FastifyReply) {
    try {
      const body = refreshTokenSchema.parse(request.body);
      const tokens = await this.authService.refreshToken(body.refreshToken);

      reply.send({
        success: true,
        data: tokens,
      });
    } catch (error: any) {
      logger.error('Refresh token error', { error });
      reply.code(401).send({
        success: false,
        error: {
          code: 'REFRESH_TOKEN_FAILED',
          message: error.message || 'Invalid refresh token',
        },
      });
    }
  }

  async logout(request: FastifyRequest, reply: FastifyReply) {
    try {
      const body = refreshTokenSchema.parse(request.body);
      await this.authService.logout(body.refreshToken);

      reply.send({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error: any) {
      logger.error('Logout error', { error });
      reply.code(400).send({
        success: false,
        error: {
          code: 'LOGOUT_FAILED',
          message: error.message || 'Logout failed',
        },
      });
    }
  }

  async me(request: FastifyRequest, reply: FastifyReply) {
    const req = request as any;
    const user = req.user;

    reply.send({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        companyId: user.companyId,
        roles: user.roles || [],
      },
    });
  }
}

