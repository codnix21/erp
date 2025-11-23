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

    // Обновляем остатки в таблице Stock
    try {
      await this.updateStock(companyId, data.warehouseId, data.productId, data.movementType, new Decimal(data.quantity));
    } catch (error: any) {
      logger.error('Error updating stock after movement', { 
        error: error.message,
        companyId,
        warehouseId: data.warehouseId,
        productId: data.productId,
      });
      // Не прерываем создание движения, но логируем ошибку
    }

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

  /**
   * Обновляет остатки в таблице Stock при создании движения
   */
  private async updateStock(
    companyId: string,
    warehouseId: string,
    productId: string,
    movementType: StockMovementType,
    quantity: Decimal
  ) {
    // Получаем текущий остаток
    // @ts-expect-error - Prisma client types will be updated after IDE restart
    const currentStock = await prisma.stock.findUnique({
      where: {
        companyId_warehouseId_productId: {
          companyId,
          warehouseId,
          productId,
        },
      },
    });

    // Обрабатываем Decimal объекты из базы данных
    let newQuantity: Decimal;
    let newReserved: Decimal;
    
    if (currentStock?.quantity) {
      if (currentStock.quantity instanceof Decimal) {
        newQuantity = currentStock.quantity;
      } else if (typeof currentStock.quantity === 'object' && 'toNumber' in currentStock.quantity) {
        newQuantity = new Decimal(currentStock.quantity.toNumber());
      } else {
        newQuantity = new Decimal(Number(currentStock.quantity));
      }
    } else {
      newQuantity = new Decimal(0);
    }
    
    if (currentStock?.reserved) {
      if (currentStock.reserved instanceof Decimal) {
        newReserved = currentStock.reserved;
      } else if (typeof currentStock.reserved === 'object' && 'toNumber' in currentStock.reserved) {
        newReserved = new Decimal(currentStock.reserved.toNumber());
      } else {
        newReserved = new Decimal(Number(currentStock.reserved));
      }
    } else {
      newReserved = new Decimal(0);
    }

    // Обновляем количество в зависимости от типа движения
    switch (movementType) {
      case StockMovementType.IN:
      case StockMovementType.ADJUSTMENT:
        newQuantity = newQuantity.plus(quantity);
        break;
      case StockMovementType.OUT:
        newQuantity = newQuantity.minus(quantity);
        if (newQuantity.lt(0)) newQuantity = new Decimal(0);
        break;
      case StockMovementType.RESERVED:
        newReserved = newReserved.plus(quantity);
        break;
      case StockMovementType.UNRESERVED:
        newReserved = newReserved.minus(quantity);
        if (newReserved.lt(0)) newReserved = new Decimal(0);
        break;
      case StockMovementType.TRANSFER:
        // Для TRANSFER нужно обработать отдельно (из одного склада в другой)
        // Пока просто обновляем текущий склад
        newQuantity = newQuantity.minus(quantity);
        if (newQuantity.lt(0)) newQuantity = new Decimal(0);
        break;
    }

    const available = newQuantity.minus(newReserved);
    if (available.lt(0)) {
      // Если доступно меньше 0, корректируем резерв
      newReserved = newQuantity;
    }

    // Создаём или обновляем запись в Stock
    // @ts-expect-error - Prisma client types will be updated after IDE restart
    await prisma.stock.upsert({
      where: {
        companyId_warehouseId_productId: {
          companyId,
          warehouseId,
          productId,
        },
      },
      create: {
        companyId,
        warehouseId,
        productId,
        quantity: newQuantity,
        reserved: newReserved,
        available: newQuantity.minus(newReserved),
        lastMovementAt: new Date(),
      },
      update: {
        quantity: newQuantity,
        reserved: newReserved,
        available: newQuantity.minus(newReserved),
        lastMovementAt: new Date(),
      },
    });
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

    try {
      // Получаем остатки из таблицы Stock (быстрее, чем вычислять из движений)
      // @ts-expect-error - Prisma client types will be updated after IDE restart
      const stockRecords = await prisma.stock.findMany({
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
      });

    // Фильтруем только товары с остатками > 0 или резервом > 0 и конвертируем Decimal в числа
    const stock = stockRecords
      .filter((item: any) => {
        const qty = typeof item.quantity === 'object' && item.quantity?.toNumber 
          ? item.quantity.toNumber() 
          : Number(item.quantity || 0);
        const res = typeof item.reserved === 'object' && item.reserved?.toNumber
          ? item.reserved.toNumber()
          : Number(item.reserved || 0);
        return qty > 0 || res > 0;
      })
      .map((item: any) => {
        const quantity = typeof item.quantity === 'object' && item.quantity?.toNumber
          ? item.quantity.toNumber()
          : Number(item.quantity || 0);
        const reserved = typeof item.reserved === 'object' && item.reserved?.toNumber
          ? item.reserved.toNumber()
          : Number(item.reserved || 0);
        const available = typeof item.available === 'object' && item.available?.toNumber
          ? item.available.toNumber()
          : Number(item.available || 0);
        return {
          warehouseId: item.warehouseId,
          warehouse: item.warehouse,
          productId: item.productId,
          product: item.product,
          quantity,
          reserved,
          available,
          lastMovement: item.lastMovementAt || item.updatedAt,
        };
      });

      return stock;
    } catch (error: any) {
      // Если таблица Stock не существует или пустая, возвращаем пустой массив
      // Это может произойти сразу после миграции, до пересчета остатков
      logger.warn('Error fetching stock from Stock table, returning empty array', { 
        error: error.message,
        companyId 
      });
      return [];
    }
  }

  /**
   * Пересчитывает остатки для всех товаров на всех складах компании
   * Используется для синхронизации после миграции или исправления расхождений
   */
  async recalculateStock(companyId: string) {
    logger.info('Starting stock recalculation', { companyId });

    // Получаем все уникальные комбинации склад-товар
    const movements = await prisma.stockMovement.findMany({
      where: { companyId },
      select: {
        warehouseId: true,
        productId: true,
      },
      distinct: ['warehouseId', 'productId'],
    });

    let recalculated = 0;

    for (const { warehouseId, productId } of movements) {
      // Получаем все движения для этой комбинации
      const allMovements = await prisma.stockMovement.findMany({
        where: {
          companyId,
          warehouseId,
          productId,
        },
        orderBy: { createdAt: 'asc' },
      });

      let quantity = new Decimal(0);
      let reserved = new Decimal(0);
      let lastMovementAt: Date | null = null;

      // Пересчитываем остатки
      for (const movement of allMovements) {
        switch (movement.movementType) {
          case StockMovementType.IN:
          case StockMovementType.ADJUSTMENT:
            quantity = quantity.plus(movement.quantity);
            break;
          case StockMovementType.OUT:
            quantity = quantity.minus(movement.quantity);
            if (quantity.lt(0)) quantity = new Decimal(0);
            break;
          case StockMovementType.RESERVED:
            reserved = reserved.plus(movement.quantity);
            break;
          case StockMovementType.UNRESERVED:
            reserved = reserved.minus(movement.quantity);
            if (reserved.lt(0)) reserved = new Decimal(0);
            break;
        }

        if (!lastMovementAt || movement.createdAt > lastMovementAt) {
          lastMovementAt = movement.createdAt;
        }
      }

      const available = quantity.minus(reserved);
      const finalAvailable = available.gt(0) ? available : new Decimal(0);

      // Обновляем или создаём запись в Stock
      // @ts-expect-error - Prisma client types will be updated after IDE restart
      await prisma.stock.upsert({
        where: {
          companyId_warehouseId_productId: {
            companyId,
            warehouseId,
            productId,
          },
        },
        create: {
          companyId,
          warehouseId,
          productId,
          quantity,
          reserved,
          available: finalAvailable,
          lastMovementAt,
        },
        update: {
          quantity,
          reserved,
          available: finalAvailable,
          lastMovementAt,
        },
      });

      recalculated++;
    }

    logger.info('Stock recalculation completed', { companyId, recalculated });
    return { recalculated };
  }
}

