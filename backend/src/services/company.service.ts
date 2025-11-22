import prisma from '../config/database';
import { CreateCompanyInput, UpdateCompanyInput } from '../validators/companies';
import logger from '../config/logger';
import { createAuditLog } from '../utils/audit';
import { Decimal } from '@prisma/client/runtime/library';

export class CompanyService {
  async createCompany(data: CreateCompanyInput, userId: string) {
    // Проверка уникальности ИНН
    if (data.inn) {
      const existing = await prisma.company.findUnique({
        where: { inn: data.inn },
      });
      if (existing) {
        throw new Error('Company with this INN already exists');
      }
    }

    const company = await prisma.company.create({
      data: {
        name: data.name,
        inn: data.inn,
        address: data.address,
        phone: data.phone,
        email: data.email,
        defaultCurrency: data.defaultCurrency,
        taxRate: new Decimal(data.taxRate),
      },
    });

    // Автоматически добавляем создателя как админа компании
    const adminRole = await prisma.role.findUnique({
      where: { name: 'Admin' },
    });

    if (adminRole) {
      await prisma.userCompanyRole.create({
        data: {
          userId,
          companyId: company.id,
          roleId: adminRole.id,
          isActive: true,
        },
      });
    }

    await createAuditLog({
      companyId: company.id,
      userId,
      action: 'CREATE',
      entityType: 'Company',
      entityId: company.id,
      newValues: company,
    });

    logger.info('Company created', { companyId: company.id, userId });
    return company;
  }

  async updateCompany(
    companyId: string,
    data: UpdateCompanyInput,
    userId: string
  ) {
    const existing = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!existing) throw new Error('Company not found');

    // Проверка уникальности ИНН при обновлении
    if (data.inn && data.inn !== existing.inn) {
      const duplicate = await prisma.company.findUnique({
        where: { inn: data.inn },
      });
      if (duplicate) {
        throw new Error('Company with this INN already exists');
      }
    }

    const oldValues = { ...existing };
    const updateData: any = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.inn !== undefined) updateData.inn = data.inn;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.defaultCurrency !== undefined) updateData.defaultCurrency = data.defaultCurrency;
    if (data.taxRate !== undefined) updateData.taxRate = new Decimal(data.taxRate);
    if (data.settings !== undefined) updateData.settings = data.settings;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const updated = await prisma.company.update({
      where: { id: companyId },
      data: updateData,
    });

    await createAuditLog({
      companyId,
      userId,
      action: 'UPDATE',
      entityType: 'Company',
      entityId: companyId,
      oldValues,
      newValues: updated,
    });

    logger.info('Company updated', { companyId, userId });
    return updated;
  }

  async getCompany(companyId: string) {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      include: {
        _count: {
          select: {
            products: true,
            customers: true,
            suppliers: true,
            orders: true,
            invoices: true,
          },
        },
      },
    });

    if (!company) throw new Error('Company not found');
    return company;
  }

  async getCompanies(
    userId: string,
    page: number = 1,
    limit: number = 20,
    filters?: { search?: string },
    isAdmin: boolean = false
  ) {
    const skip = (page - 1) * limit;
    const where: any = {};

    // Если админ - показываем все компании, иначе только те, к которым есть доступ
    if (!isAdmin) {
      const userCompanies = await prisma.userCompanyRole.findMany({
        where: {
          userId,
          isActive: true,
        },
        include: {
          company: true,
        },
      });

      const companyIds = userCompanies.map((uc) => uc.companyId);
      where.id = { in: companyIds };
    }

    if (filters?.search) {
      const searchCondition = {
        OR: [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { inn: { contains: filters.search, mode: 'insensitive' } },
          { email: { contains: filters.search, mode: 'insensitive' } },
        ],
      };
      
      if (where.id) {
        where.AND = [where.id, searchCondition];
        delete where.id;
      } else {
        where.OR = searchCondition.OR;
      }
    }

    const [companies, total] = await Promise.all([
      prisma.company.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.company.count({ where }),
    ]);

    return {
      data: companies,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async deleteCompany(companyId: string, userId: string) {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) throw new Error('Company not found');

    // Проверка на наличие данных
    const hasData = await prisma.product.count({ where: { companyId } }) > 0 ||
      await prisma.order.count({ where: { companyId } }) > 0;

    if (hasData) {
      throw new Error('Cannot delete company with existing data. Deactivate it instead.');
    }

    await prisma.company.delete({ where: { id: companyId } });

    await createAuditLog({
      companyId: null,
      userId,
      action: 'DELETE',
      entityType: 'Company',
      entityId: companyId,
      oldValues: company,
    });

    logger.info('Company deleted', { companyId, userId });
  }
}

