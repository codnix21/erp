import { Prisma } from '@prisma/client';
const { Decimal } = Prisma;
import prisma from '../config/database';
import { CreateOrderInput, UpdateOrderInput } from '../validators/orders';
import logger from '../config/logger';
import { createAuditLog } from '../utils/audit';

export class OrderService {
  async createOrder(data: CreateOrderInput, companyId: string, userId: string) {
    // Генерация номера заказа
    const orderNumber = await this.generateOrderNumber(companyId);

    // Подсчёт общей суммы
    let totalAmount = new Decimal(0);
    const items = data.items.map((item) => {
      const itemTotal = new Decimal(item.quantity).mul(item.price);
      const taxAmount = itemTotal.mul(new Decimal(item.taxRate).div(100));
      const total = itemTotal.plus(taxAmount);
      totalAmount = totalAmount.plus(total);

      return {
        productId: item.productId,
        quantity: new Decimal(item.quantity),
        price: new Decimal(item.price),
        taxRate: new Decimal(item.taxRate),
        total,
      };
    });

    // Создание заказа
    const order = await prisma.order.create({
      data: {
        companyId,
        customerId: data.customerId,
        supplierId: data.supplierId,
        orderNumber,
        status: data.status,
        totalAmount,
        currency: data.currency,
        notes: data.notes,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        createdById: userId,
        items: {
          create: items,
        },
      },
      include: {
        customer: true,
        supplier: true,
        items: {
          include: {
            product: true,
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

    // Аудит
    await createAuditLog({
      companyId,
      userId,
      action: 'CREATE',
      entityType: 'Order',
      entityId: order.id,
      newValues: order,
    });

    logger.info('Order created', { orderId: order.id, companyId, userId });

    return order;
  }

  async updateOrder(
    orderId: string,
    data: UpdateOrderInput,
    companyId: string,
    userId: string
  ) {
    // Проверка существования и доступа
    const existingOrder = await prisma.order.findFirst({
      where: {
        id: orderId,
        companyId,
      },
      include: {
        items: true,
      },
    });

    if (!existingOrder) {
      throw new Error('Order not found');
    }

    const oldValues = { ...existingOrder };

    // Обновление позиций, если они переданы
    let totalAmount = existingOrder.totalAmount;
    if (data.items) {
      // Удаляем старые позиции
      await prisma.orderItem.deleteMany({
        where: { orderId },
      });

      // Создаём новые
      totalAmount = new Decimal(0);
      const items = data.items.map((item) => {
        const itemTotal = new Decimal(item.quantity).mul(item.price);
        const taxAmount = itemTotal.mul(new Decimal(item.taxRate).div(100));
        const total = itemTotal.plus(taxAmount);
        totalAmount = totalAmount.plus(total);

        return {
          productId: item.productId,
          quantity: new Decimal(item.quantity),
          price: new Decimal(item.price),
          taxRate: new Decimal(item.taxRate),
          total,
        };
      });

      await prisma.orderItem.createMany({
        data: items.map((item) => ({
          ...item,
          orderId,
        })),
      });
    }

    // Обновление заказа
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        customerId: data.customerId ?? existingOrder.customerId,
        supplierId: data.supplierId ?? existingOrder.supplierId,
        status: data.status ?? existingOrder.status,
        currency: data.currency ?? existingOrder.currency,
        notes: data.notes ?? existingOrder.notes,
        dueDate: data.dueDate ? new Date(data.dueDate) : existingOrder.dueDate,
        totalAmount,
      },
      include: {
        customer: true,
        supplier: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    // Аудит
    await createAuditLog({
      companyId,
      userId,
      action: 'UPDATE',
      entityType: 'Order',
      entityId: orderId,
      oldValues,
      newValues: updatedOrder,
    });

    logger.info('Order updated', { orderId, companyId, userId });

    return updatedOrder;
  }

  async getOrder(orderId: string, companyId: string) {
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        companyId,
      },
      include: {
        customer: true,
        supplier: true,
        items: {
          include: {
            product: true,
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
        invoices: true,
      },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    return order;
  }

  async getOrders(
    companyId: string,
    page: number = 1,
    limit: number = 20,
    filters?: {
      status?: string;
      customerId?: string;
      supplierId?: string;
      search?: string;
    }
  ) {
    const skip = (page - 1) * limit;

    const where: any = {
      companyId,
    };

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.customerId) {
      where.customerId = filters.customerId;
    }

    if (filters?.supplierId) {
      where.supplierId = filters.supplierId;
    }

    if (filters?.search) {
      where.OR = [
        { orderNumber: { contains: filters.search, mode: 'insensitive' } },
        { notes: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
            },
          },
          supplier: {
            select: {
              id: true,
              name: true,
            },
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  sku: true,
                },
              },
            },
          },
        },
      }),
      prisma.order.count({ where }),
    ]);

    return {
      data: orders,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async deleteOrder(orderId: string, companyId: string, userId: string) {
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        companyId,
      },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    // Проверка на связанные счета
    const invoices = await prisma.invoice.count({
      where: { orderId },
    });

    if (invoices > 0) {
      throw new Error('Cannot delete order with associated invoices');
    }

    await prisma.order.delete({
      where: { id: orderId },
    });

    // Аудит
    await createAuditLog({
      companyId,
      userId,
      action: 'DELETE',
      entityType: 'Order',
      entityId: orderId,
      oldValues: order,
    });

    logger.info('Order deleted', { orderId, companyId, userId });
  }

  private async generateOrderNumber(companyId: string): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `ORD-${year}-`;

    const lastOrder = await prisma.order.findFirst({
      where: {
        companyId,
        orderNumber: {
          startsWith: prefix,
        },
      },
      orderBy: {
        orderNumber: 'desc',
      },
    });

    let sequence = 1;
    if (lastOrder) {
      const lastSequence = parseInt(lastOrder.orderNumber.replace(prefix, ''));
      sequence = lastSequence + 1;
    }

    return `${prefix}${sequence.toString().padStart(6, '0')}`;
  }
}

