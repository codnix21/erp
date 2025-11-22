import prisma from '../config/database';
import bcrypt from 'bcrypt';
import { CreateUserInput, UpdateUserInput, AssignRoleInput } from '../validators/users';
import logger from '../config/logger';
import { createAuditLog } from '../utils/audit';

export class UserService {
  async createUser(data: CreateUserInput, createdById: string) {
    // Проверка уникальности email
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new Error('Пользователь с таким email уже существует');
    }

    // Хеширование пароля
    const passwordHash = await bcrypt.hash(data.password, 10);

    // Создание пользователя
    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
      },
    });

    // Назначение роли в компании
    await prisma.userCompanyRole.create({
      data: {
        userId: user.id,
        companyId: data.companyId,
        roleId: data.roleId,
        isActive: true,
      },
    });

    await createAuditLog({
      companyId: data.companyId,
      userId: createdById,
      action: 'CREATE',
      entityType: 'User',
      entityId: user.id,
      newValues: { email: user.email, firstName: user.firstName, lastName: user.lastName },
    });

    logger.info('User created', { userId: user.id, email: user.email, createdById });

    return user;
  }

  async updateUser(userId: string, data: UpdateUserInput, updatedById: string) {
    const existing = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        userCompanyRoles: {
          include: { company: true },
        },
      },
    });

    if (!existing) {
      throw new Error('Пользователь не найден');
    }

    const oldValues = { ...existing };

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        isActive: data.isActive,
      },
    });

    // Аудит для каждой компании пользователя
    for (const ucr of existing.userCompanyRoles) {
      await createAuditLog({
        companyId: ucr.companyId,
        userId: updatedById,
        action: 'UPDATE',
        entityType: 'User',
        entityId: userId,
        oldValues: { email: oldValues.email, firstName: oldValues.firstName, lastName: oldValues.lastName, isActive: oldValues.isActive },
        newValues: { email: updated.email, firstName: updated.firstName, lastName: updated.lastName, isActive: updated.isActive },
      });
    }

    logger.info('User updated', { userId, updatedById });

    return updated;
  }

  async getUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        userCompanyRoles: {
          include: {
            company: true,
            role: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error('Пользователь не найден');
    }

    return user;
  }

  async getUsers(page: number = 1, limit: number = 20, filters?: { search?: string; companyId?: string }) {
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters?.search) {
      where.OR = [
        { email: { contains: filters.search, mode: 'insensitive' } },
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters?.companyId) {
      where.userCompanyRoles = {
        some: {
          companyId: filters.companyId,
        },
      };
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        include: {
          userCompanyRoles: {
            include: {
              company: true,
              role: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async deleteUser(userId: string, deletedById: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        userCompanyRoles: {
          include: { company: true },
        },
      },
    });

    if (!user) {
      throw new Error('Пользователь не найден');
    }

    // Аудит перед удалением
    for (const ucr of user.userCompanyRoles) {
      await createAuditLog({
        companyId: ucr.companyId,
        userId: deletedById,
        action: 'DELETE',
        entityType: 'User',
        entityId: userId,
        oldValues: { email: user.email, firstName: user.firstName, lastName: user.lastName },
      });
    }

    await prisma.user.delete({
      where: { id: userId },
    });

    logger.info('User deleted', { userId, deletedById });
  }

  async assignRole(userId: string, data: AssignRoleInput, assignedById: string) {
    // Проверка существования пользователя
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('Пользователь не найден');
    }

    // Проверка существования компании и роли
    const [company, role] = await Promise.all([
      prisma.company.findUnique({ where: { id: data.companyId } }),
      prisma.role.findUnique({ where: { id: data.roleId } }),
    ]);

    if (!company) {
      throw new Error('Компания не найдена');
    }

    if (!role) {
      throw new Error('Роль не найдена');
    }

    // Проверка, не назначена ли уже эта роль
    const existing = await prisma.userCompanyRole.findUnique({
      where: {
        userId_companyId_roleId: {
          userId,
          companyId: data.companyId,
          roleId: data.roleId,
        },
      },
    });

    if (existing) {
      // Активируем роль, если она была деактивирована
      if (!existing.isActive) {
        await prisma.userCompanyRole.update({
          where: { id: existing.id },
          data: { isActive: true },
        });
      }
      return;
    }

    // Назначение роли
    await prisma.userCompanyRole.create({
      data: {
        userId,
        companyId: data.companyId,
        roleId: data.roleId,
        isActive: true,
      },
    });

    await createAuditLog({
      companyId: data.companyId,
      userId: assignedById,
      action: 'UPDATE',
      entityType: 'User',
      entityId: userId,
      newValues: { role: role.name, company: company.name },
    });

    logger.info('Role assigned', { userId, companyId: data.companyId, roleId: data.roleId, assignedById });
  }

  async removeRole(userId: string, userCompanyRoleId: string, removedById: string) {
    const userCompanyRole = await prisma.userCompanyRole.findUnique({
      where: { id: userCompanyRoleId },
      include: {
        user: true,
        company: true,
        role: true,
      },
    });

    if (!userCompanyRole) {
      throw new Error('Роль не найдена');
    }

    if (userCompanyRole.userId !== userId) {
      throw new Error('Роль не принадлежит этому пользователю');
    }

    // Деактивируем роль вместо удаления
    await prisma.userCompanyRole.update({
      where: { id: userCompanyRoleId },
      data: { isActive: false },
    });

    await createAuditLog({
      companyId: userCompanyRole.companyId,
      userId: removedById,
      action: 'UPDATE',
      entityType: 'User',
      entityId: userId,
      oldValues: { role: userCompanyRole.role.name, company: userCompanyRole.company.name },
      newValues: { role: userCompanyRole.role.name, company: userCompanyRole.company.name, isActive: false },
    });

    logger.info('Role removed', { userId, userCompanyRoleId, removedById });
  }
}

