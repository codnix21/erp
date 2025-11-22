import prisma from '../config/database';
import { CreateSupplierInput, UpdateSupplierInput } from '../validators/suppliers';
import logger from '../config/logger';
import { createAuditLog } from '../utils/audit';

export class SupplierService {
  async createSupplier(data: CreateSupplierInput, companyId: string, userId: string) {
    const supplier = await prisma.supplier.create({
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
      entityType: 'Supplier',
      entityId: supplier.id,
      newValues: supplier,
    });

    logger.info('Supplier created', { supplierId: supplier.id, companyId, userId });
    return supplier;
  }

  async updateSupplier(
    supplierId: string,
    data: UpdateSupplierInput,
    companyId: string,
    userId: string
  ) {
    const existing = await prisma.supplier.findFirst({
      where: { id: supplierId, companyId },
    });

    if (!existing) throw new Error('Supplier not found');

    const oldValues = { ...existing };
    const updated = await prisma.supplier.update({
      where: { id: supplierId },
      data,
    });

    await createAuditLog({
      companyId,
      userId,
      action: 'UPDATE',
      entityType: 'Supplier',
      entityId: supplierId,
      oldValues,
      newValues: updated,
    });

    logger.info('Supplier updated', { supplierId, companyId, userId });
    return updated;
  }

  async getSupplier(supplierId: string, companyId: string) {
    const supplier = await prisma.supplier.findFirst({
      where: { id: supplierId, companyId },
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

    if (!supplier) throw new Error('Supplier not found');
    return supplier;
  }

  async getSuppliers(
    companyId: string,
    page: number = 1,
    limit: number = 20,
    filters?: { search?: string }
  ) {
    const skip = (page - 1) * limit;
    const where: any = { companyId };

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { phone: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [suppliers, total] = await Promise.all([
      prisma.supplier.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.supplier.count({ where }),
    ]);

    return {
      data: suppliers,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async deleteSupplier(supplierId: string, companyId: string, userId: string) {
    const supplier = await prisma.supplier.findFirst({
      where: { id: supplierId, companyId },
    });

    if (!supplier) throw new Error('Supplier not found');

    const orders = await prisma.order.count({ where: { supplierId } });
    if (orders > 0) throw new Error('Cannot delete supplier with associated orders');

    await prisma.supplier.delete({ where: { id: supplierId } });

    await createAuditLog({
      companyId,
      userId,
      action: 'DELETE',
      entityType: 'Supplier',
      entityId: supplierId,
      oldValues: supplier,
    });

    logger.info('Supplier deleted', { supplierId, companyId, userId });
  }
}

