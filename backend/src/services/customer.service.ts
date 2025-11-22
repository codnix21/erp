import prisma from '../config/database';
import { CreateCustomerInput, UpdateCustomerInput } from '../validators/customers';
import logger from '../config/logger';
import { createAuditLog } from '../utils/audit';

export class CustomerService {
  async createCustomer(data: CreateCustomerInput, companyId: string, userId: string) {
    const customer = await prisma.customer.create({
      data: {
        companyId,
        name: data.name,
        email: data.email,
        phone: data.phone,
        address: data.address,
        taxId: data.taxId,
        notes: data.notes,
      },
    });

    await createAuditLog({
      companyId,
      userId,
      action: 'CREATE',
      entityType: 'Customer',
      entityId: customer.id,
      newValues: customer,
    });

    logger.info('Customer created', { customerId: customer.id, companyId, userId });

    return customer;
  }

  async updateCustomer(
    customerId: string,
    data: UpdateCustomerInput,
    companyId: string,
    userId: string
  ) {
    const existing = await prisma.customer.findFirst({
      where: {
        id: customerId,
        companyId,
      },
    });

    if (!existing) {
      throw new Error('Customer not found');
    }

    const oldValues = { ...existing };

    const updated = await prisma.customer.update({
      where: { id: customerId },
      data,
    });

    await createAuditLog({
      companyId,
      userId,
      action: 'UPDATE',
      entityType: 'Customer',
      entityId: customerId,
      oldValues,
      newValues: updated,
    });

    logger.info('Customer updated', { customerId, companyId, userId });

    return updated;
  }

  async getCustomer(customerId: string, companyId: string) {
    const customer = await prisma.customer.findFirst({
      where: {
        id: customerId,
        companyId,
      },
      include: {
        orders: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            orderNumber: true,
            status: true,
            totalAmount: true,
            createdAt: true,
          },
        },
      },
    });

    if (!customer) {
      throw new Error('Customer not found');
    }

    return customer;
  }

  async getCustomers(
    companyId: string,
    page: number = 1,
    limit: number = 20,
    filters?: {
      search?: string;
    }
  ) {
    const skip = (page - 1) * limit;

    const where: any = {
      companyId,
    };

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { phone: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.customer.count({ where }),
    ]);

    return {
      data: customers,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async deleteCustomer(customerId: string, companyId: string, userId: string) {
    const customer = await prisma.customer.findFirst({
      where: {
        id: customerId,
        companyId,
      },
    });

    if (!customer) {
      throw new Error('Customer not found');
    }

    // Проверка на использование в заказах
    const orders = await prisma.order.count({
      where: { customerId },
    });

    if (orders > 0) {
      throw new Error('Cannot delete customer with associated orders');
    }

    await prisma.customer.delete({
      where: { id: customerId },
    });

    await createAuditLog({
      companyId,
      userId,
      action: 'DELETE',
      entityType: 'Customer',
      entityId: customerId,
      oldValues: customer,
    });

    logger.info('Customer deleted', { customerId, companyId, userId });
  }
}

