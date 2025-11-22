import { FastifyRequest, FastifyReply } from 'fastify';
import { UserService } from '../services/user.service';
import {
  createUserSchema,
  updateUserSchema,
  getUserSchema,
  getUsersSchema,
  assignRoleSchema,
  removeRoleSchema,
} from '../validators/users';
import { AuthenticatedRequest } from '../types/auth';
import logger from '../config/logger';

export class UserController {
  constructor(private userService: UserService) {}

  async create(request: FastifyRequest, reply: FastifyReply) {
    try {
      const req = request as AuthenticatedRequest;
      const { body } = createUserSchema.parse(request);

      const user = await this.userService.createUser(body, req.user.id);

      reply.code(201).send({
        success: true,
        data: user,
      });
    } catch (error: any) {
      logger.error('Create user error', { error: error.message });
      reply.code(400).send({
        success: false,
        error: {
          code: 'USER_CREATE_FAILED',
          message: error.message || 'Failed to create user',
        },
      });
    }
  }

  async getOne(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { params } = getUserSchema.parse(request);
      const user = await this.userService.getUser(params.id);

      reply.send({
        success: true,
        data: user,
      });
    } catch (error: any) {
      logger.error('Get user error', { error: error.message });
      reply.code(404).send({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: error.message || 'User not found',
        },
      });
    }
  }

  async getAll(request: FastifyRequest, reply: FastifyReply) {
    try {
      const { query } = getUsersSchema.parse(request);
      const result = await this.userService.getUsers(query.page, query.limit, {
        search: query.search,
        companyId: query.companyId,
      });

      reply.send({
        success: true,
        data: result.data,
        meta: result.meta,
      });
    } catch (error: any) {
      logger.error('Get users error', { error: error.message });
      reply.code(400).send({
        success: false,
        error: {
          code: 'USERS_FETCH_FAILED',
          message: error.message || 'Failed to fetch users',
        },
      });
    }
  }

  async update(request: FastifyRequest, reply: FastifyReply) {
    try {
      const req = request as AuthenticatedRequest;
      const { params, body } = updateUserSchema.parse(request);

      const user = await this.userService.updateUser(params.id, body, req.user.id);

      reply.send({
        success: true,
        data: user,
      });
    } catch (error: any) {
      logger.error('Update user error', { error: error.message });
      reply.code(400).send({
        success: false,
        error: {
          code: 'USER_UPDATE_FAILED',
          message: error.message || 'Failed to update user',
        },
      });
    }
  }

  async delete(request: FastifyRequest, reply: FastifyReply) {
    try {
      const req = request as AuthenticatedRequest;
      const { id } = request.params as { id: string };

      await this.userService.deleteUser(id, req.user.id);

      reply.send({
        success: true,
        message: 'User deleted successfully',
      });
    } catch (error: any) {
      logger.error('Delete user error', { error: error.message });
      reply.code(400).send({
        success: false,
        error: {
          code: 'USER_DELETE_FAILED',
          message: error.message || 'Failed to delete user',
        },
      });
    }
  }

  async assignRole(request: FastifyRequest, reply: FastifyReply) {
    try {
      const req = request as AuthenticatedRequest;
      const { params, body } = assignRoleSchema.parse(request);

      await this.userService.assignRole(params.id, body, req.user.id);

      reply.send({
        success: true,
        message: 'Role assigned successfully',
      });
    } catch (error: any) {
      logger.error('Assign role error', { error: error.message });
      reply.code(400).send({
        success: false,
        error: {
          code: 'ROLE_ASSIGN_FAILED',
          message: error.message || 'Failed to assign role',
        },
      });
    }
  }

  async removeRole(request: FastifyRequest, reply: FastifyReply) {
    try {
      const req = request as AuthenticatedRequest;
      const { params } = removeRoleSchema.parse(request);
      // params.roleId здесь на самом деле userCompanyRoleId
      await this.userService.removeRole(params.id, params.roleId, req.user.id);

      reply.send({
        success: true,
        message: 'Role removed successfully',
      });
    } catch (error: any) {
      logger.error('Remove role error', { error: error.message });
      reply.code(400).send({
        success: false,
        error: {
          code: 'ROLE_REMOVE_FAILED',
          message: error.message || 'Failed to remove role',
        },
      });
    }
  }
}

