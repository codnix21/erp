import prisma from '../config/database';
import { CreateWarehouseInput, UpdateWarehouseInput } from '../validators/warehouses';
import logger from '../config/logger';
import { createAuditLog } from '../utils/audit';

export class WarehouseService {
  async createWarehouse(data: CreateWarehouseInput, companyId: string, userId: string) {
    const warehouse = await prisma.warehouse.create({
      data: {
        companyId,
        name: data.name,
        address: data.address,
      },
    });

    await createAuditLog({
      companyId,
      userId,
      action: 'CREATE',
      entityType: 'Warehouse',
      entityId: warehouse.id,
      newValues: warehouse,
    });

    logger.info('Warehouse created', { warehouseId: warehouse.id, companyId, userId });
    return warehouse;
  }

  async updateWarehouse(
    warehouseId: string,
    data: UpdateWarehouseInput,
    companyId: string,
    userId: string
  ) {
    const existing = await prisma.warehouse.findFirst({
      where: { id: warehouseId, companyId },
    });

    if (!existing) throw new Error('Warehouse not found');

    const oldValues = { ...existing };
    const updated = await prisma.warehouse.update({
      where: { id: warehouseId },
      data,
    });

    await createAuditLog({
      companyId,
      userId,
      action: 'UPDATE',
      entityType: 'Warehouse',
      entityId: warehouseId,
      oldValues,
      newValues: updated,
    });

    logger.info('Warehouse updated', { warehouseId, companyId, userId });
    return updated;
  }

  async getWarehouse(warehouseId: string, companyId: string) {
    const warehouse = await prisma.warehouse.findFirst({
      where: { id: warehouseId, companyId },
    });

    if (!warehouse) throw new Error('Warehouse not found');
    return warehouse;
  }

  async getWarehouses(
    companyId: string,
    page: number = 1,
    limit: number = 20,
    filters?: { search?: string }
  ) {
    const skip = (page - 1) * limit;
    const where: any = { companyId, isActive: true };

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { address: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [warehouses, total] = await Promise.all([
      prisma.warehouse.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.warehouse.count({ where }),
    ]);

    return {
      data: warehouses,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async deleteWarehouse(warehouseId: string, companyId: string, userId: string) {
    const warehouse = await prisma.warehouse.findFirst({
      where: { id: warehouseId, companyId },
    });

    if (!warehouse) throw new Error('Warehouse not found');

    const movements = await prisma.stockMovement.count({ where: { warehouseId } });
    if (movements > 0) {
      throw new Error('Cannot delete warehouse with stock movements');
    }

    await prisma.warehouse.delete({ where: { id: warehouseId } });

    await createAuditLog({
      companyId,
      userId,
      action: 'DELETE',
      entityType: 'Warehouse',
      entityId: warehouseId,
      oldValues: warehouse,
    });

    logger.info('Warehouse deleted', { warehouseId, companyId, userId });
  }
}

