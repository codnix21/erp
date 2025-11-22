import prisma from '../config/database';
import { CreateStockMovementInput, GetStockMovementsInput } from '../validators/stock-movements';
import logger from '../config/logger';
import { createAuditLog } from '../utils/audit';
import { Decimal } from '@prisma/client/runtime/library';
import { StockMovementType } from '@prisma/client';

export class StockMovementService {
  async createStockMovement(
    data: CreateStockMovementInput,
    companyId: string,
    userId: string
  ) {
    // Проверка существования склада и товара
    const [warehouse, product] = await Promise.all([
      prisma.warehouse.findFirst({
        where: { id: data.warehouseId, companyId },
      }),
      prisma.product.findFirst({
        where: { id: data.productId, companyId },
      }),
    ]);

    if (!warehouse) throw new Error('Warehouse not found');
    if (!product) throw new Error('Product not found');
    if (product.isService) throw new Error('Cannot track stock for services');

    const movement = await prisma.stockMovement.create({
      data: {
        companyId,
        warehouseId: data.warehouseId,
        productId: data.productId,
        movementType: data.movementType,
        quantity: new Decimal(data.quantity),
        referenceId: data.referenceId,
        referenceType: data.referenceType,
        notes: data.notes,
        createdById: userId,
      },
      include: {
        warehouse: true,
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    await createAuditLog({
      companyId,
      userId,
      action: 'CREATE',
      entityType: 'StockMovement',
      entityId: movement.id,
      newValues: movement,
    });

    logger.info('Stock movement created', {
      movementId: movement.id,
      companyId,
      userId,
      type: data.movementType,
    });

    return movement;
  }

  async getStockMovements(
    companyId: string,
    page: number = 1,
    limit: number = 20,
    filters?: GetStockMovementsInput
  ) {
    const skip = (page - 1) * limit;
    const where: any = { companyId };

    if (filters?.warehouseId) where.warehouseId = filters.warehouseId;
    if (filters?.productId) where.productId = filters.productId;
    if (filters?.movementType) where.movementType = filters.movementType;

    if (filters?.dateFrom || filters?.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) {
        where.createdAt.gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        where.createdAt.lte = new Date(filters.dateTo);
      }
    }

    const [movements, total] = await Promise.all([
      prisma.stockMovement.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          warehouse: {
            select: {
              id: true,
              name: true,
            },
          },
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
      prisma.stockMovement.count({ where }),
    ]);

    return {
      data: movements,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getStock(companyId: string, filters?: { warehouseId?: string; productId?: string }) {
    const where: any = { companyId };

    if (filters?.warehouseId) where.warehouseId = filters.warehouseId;
    if (filters?.productId) where.productId = filters.productId;

    // Получаем все движения для расчёта остатков
    const movements = await prisma.stockMovement.findMany({
      where,
      include: {
        warehouse: {
          select: {
            id: true,
            name: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            unit: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Группируем по складу и товару и считаем остатки
    const stockMap = new Map<string, {
      warehouseId: string;
      warehouse: any;
      productId: string;
      product: any;
      quantity: Decimal;
      reserved: Decimal;
      lastMovement: Date;
    }>();

    movements.forEach((movement) => {
      const key = `${movement.warehouseId}-${movement.productId}`;
      const current = stockMap.get(key) || {
        warehouseId: movement.warehouseId,
        warehouse: movement.warehouse,
        productId: movement.productId,
        product: movement.product,
        quantity: new Decimal(0),
        reserved: new Decimal(0),
        lastMovement: movement.createdAt,
      };

      switch (movement.movementType) {
        case StockMovementType.IN:
        case StockMovementType.ADJUSTMENT:
          current.quantity = current.quantity.plus(movement.quantity);
          break;
        case StockMovementType.OUT:
          current.quantity = current.quantity.minus(movement.quantity);
          break;
        case StockMovementType.RESERVED:
          current.reserved = current.reserved.plus(movement.quantity);
          break;
        case StockMovementType.UNRESERVED:
          current.reserved = current.reserved.minus(movement.quantity);
          break;
      }

      if (movement.createdAt > current.lastMovement) {
        current.lastMovement = movement.createdAt;
      }

      stockMap.set(key, current);
    });

    // Фильтруем только товары с остатками > 0 или резервом > 0
    const stock = Array.from(stockMap.values())
      .filter((item) => item.quantity.gt(0) || item.reserved.gt(0))
      .map((item) => ({
        warehouseId: item.warehouseId,
        warehouse: item.warehouse,
        productId: item.productId,
        product: item.product,
        quantity: item.quantity,
        reserved: item.reserved,
        available: item.quantity.minus(item.reserved),
        lastMovement: item.lastMovement,
      }));

    return stock;
  }
}

