import prisma from '../config/database';
import { Decimal } from '@prisma/client/runtime/library';

interface ReportFilters {
  startDate?: string;
  endDate?: string;
  status?: string;
}

export class ReportService {
  async getSalesReport(companyId: string, filters?: ReportFilters) {
    const where: any = {
      companyId,
      status: 'COMPLETED',
    };

    if (filters?.startDate) {
      where.createdAt = { ...where.createdAt, gte: new Date(filters.startDate) };
    }
    if (filters?.endDate) {
      where.createdAt = { ...where.createdAt, lte: new Date(filters.endDate) };
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        items: {
          include: {
            product: true,
          },
        },
        customer: true,
      },
    });

    const totalRevenue = orders.reduce(
      (sum, order) => sum + Number(order.totalAmount),
      0
    );

    const totalOrders = orders.length;

    // Получаем информацию о доступных датах (без фильтров) для продаж
    const firstSaleOrder = await prisma.order.findFirst({
      where: {
        companyId,
        status: 'COMPLETED',
        customerId: { not: null },
      },
      select: {
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const lastSaleOrder = await prisma.order.findFirst({
      where: {
        companyId,
        status: 'COMPLETED',
        customerId: { not: null },
      },
      select: {
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const productsSold = orders.reduce((acc, order) => {
      order.items.forEach((item) => {
        const productId = item.productId;
        if (!acc[productId]) {
          acc[productId] = {
            product: item.product,
            quantity: 0,
            revenue: 0,
          };
        }
        acc[productId].quantity += Number(item.quantity);
        acc[productId].revenue += Number(item.quantity) * Number(item.price);
      });
      return acc;
    }, {} as Record<string, any>);

    // Последние заказы с датами
    const recentOrders = orders
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
      .map((order) => ({
        orderNumber: order.orderNumber,
        date: order.createdAt,
        amount: Number(order.totalAmount),
        customer: order.customer?.name || 'Неизвестный клиент',
      }));

    return {
      period: {
        start: filters?.startDate || null,
        end: filters?.endDate || null,
      },
      availableDates: {
        first: firstSaleOrder?.createdAt || null,
        last: lastSaleOrder?.createdAt || null,
      },
      summary: {
        totalOrders,
        totalRevenue,
        averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
      },
      topProducts: Object.values(productsSold)
        .sort((a: any, b: any) => b.revenue - a.revenue)
        .slice(0, 10),
      recentOrders,
    };
  }

  async getPurchasesReport(companyId: string, filters?: ReportFilters) {
    const where: any = {
      companyId,
      status: 'COMPLETED',
    };

    if (filters?.startDate) {
      where.createdAt = { ...where.createdAt, gte: new Date(filters.startDate) };
    }
    if (filters?.endDate) {
      where.createdAt = { ...where.createdAt, lte: new Date(filters.endDate) };
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        items: {
          include: {
            product: true,
          },
        },
        supplier: true,
      },
    });

    const totalSpent = orders.reduce(
      (sum, order) => sum + Number(order.totalAmount),
      0
    );

    // Получаем информацию о доступных датах (без фильтров) для закупок
    const firstPurchaseOrder = await prisma.order.findFirst({
      where: {
        companyId,
        status: 'COMPLETED',
        supplierId: { not: null },
      },
      select: {
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const lastPurchaseOrder = await prisma.order.findFirst({
      where: {
        companyId,
        status: 'COMPLETED',
        supplierId: { not: null },
      },
      select: {
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      period: {
        start: filters?.startDate || null,
        end: filters?.endDate || null,
      },
      availableDates: {
        first: firstPurchaseOrder?.createdAt || null,
        last: lastPurchaseOrder?.createdAt || null,
      },
      summary: {
        totalOrders: orders.length,
        totalSpent,
        averageOrderValue:
          orders.length > 0 ? totalSpent / orders.length : 0,
      },
      orders: orders.map((order) => ({
        orderNumber: order.orderNumber,
        supplier: order.supplier?.name,
        amount: Number(order.totalAmount),
        currency: order.currency,
        date: order.createdAt,
      })),
    };
  }

  async getWarehouseReport(companyId: string, warehouseId?: string) {
    const where: any = { companyId };
    if (warehouseId) {
      where.warehouseId = warehouseId;
    }

    const stockMovements = await prisma.stockMovement.findMany({
      where,
      include: {
        product: true,
        warehouse: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Получаем остатки через Prisma
    const warehouses = await prisma.warehouse.findMany({
      where: {
        companyId,
        ...(warehouseId && { id: warehouseId }),
      },
    });

    const stock: any[] = [];

    for (const warehouse of warehouses) {
      const movements = await prisma.stockMovement.groupBy({
        by: ['productId'],
        where: {
          warehouseId: warehouse.id,
          companyId,
        },
        _sum: {
          quantity: true,
        },
      });

      for (const movement of movements) {
        const product = await prisma.product.findUnique({
          where: { id: movement.productId },
        });

        if (product && movement._sum.quantity) {
          const quantity = Number(movement._sum.quantity);
          if (quantity > 0) {
            stock.push({
              warehouseId: warehouse.id,
              warehouseName: warehouse.name,
              productId: product.id,
              productName: product.name,
              sku: product.sku,
              quantity,
            });
          }
        }
      }
    }

    return {
      stock: stock.map((item) => ({
        warehouseId: item.warehouse_id,
        warehouseName: item.warehouse_name,
        productId: item.product_id,
        productName: item.product_name,
        sku: item.sku,
        quantity: Number(item.quantity),
      })),
      movements: stockMovements.slice(0, 100).map((movement) => ({
        id: movement.id,
        date: movement.createdAt,
        warehouse: movement.warehouse.name,
        product: movement.product.name,
        type: movement.movementType,
        quantity: Number(movement.quantity),
      })),
    };
  }

  async getFinancialReport(companyId: string, filters?: ReportFilters) {
    const where: any = { companyId };

    if (filters?.startDate) {
      where.issuedDate = { ...where.issuedDate, gte: new Date(filters.startDate) };
    }
    if (filters?.endDate) {
      where.issuedDate = { ...where.issuedDate, lte: new Date(filters.endDate) };
    }

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        payments: true,
      },
    });

    const totalInvoiced = invoices.reduce(
      (sum, invoice) => sum + Number(invoice.totalAmount),
      0
    );

    const totalPaid = invoices.reduce(
      (sum, invoice) => sum + Number(invoice.paidAmount),
      0
    );

    const totalOutstanding = totalInvoiced - totalPaid;

    const payments = await prisma.payment.findMany({
      where: {
        companyId,
        ...(filters?.startDate && {
          paymentDate: { gte: new Date(filters.startDate) },
        }),
        ...(filters?.endDate && {
          paymentDate: { lte: new Date(filters.endDate) },
        }),
      },
    });

    // Получаем информацию о доступных датах (без фильтров)
    const firstInvoice = await prisma.invoice.findFirst({
      where: { companyId },
      select: { issuedDate: true },
      orderBy: { issuedDate: 'asc' },
    });

    const lastInvoice = await prisma.invoice.findFirst({
      where: { companyId },
      select: { issuedDate: true },
      orderBy: { issuedDate: 'desc' },
    });

    return {
      period: {
        start: filters?.startDate || null,
        end: filters?.endDate || null,
      },
      availableDates: {
        first: firstInvoice?.issuedDate || null,
        last: lastInvoice?.issuedDate || null,
      },
      summary: {
        totalInvoiced,
        totalPaid,
        totalOutstanding,
        totalPayments: payments.length,
      },
      byStatus: {
        DRAFT: invoices.filter((i) => i.status === 'DRAFT').length,
        ISSUED: invoices.filter((i) => i.status === 'ISSUED').length,
        PAID: invoices.filter((i) => i.status === 'PAID').length,
        PARTIALLY_PAID: invoices.filter((i) => i.status === 'PARTIALLY_PAID')
          .length,
        OVERDUE: invoices.filter((i) => i.status === 'OVERDUE').length,
      },
    };
  }
}

