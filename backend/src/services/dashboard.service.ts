import prisma from '../config/database';
import logger from '../config/logger';

export class DashboardService {
  async getStats(companyId: string) {
    try {
      // Выполняем все запросы параллельно для максимальной производительности
      const [
        ordersCount,
        customersCount,
        productsCount,
        invoicesCount,
        completedOrders,
        suppliersCount,
        warehousesCount,
        paymentsCount,
        pendingOrders,
        unpaidInvoices,
      ] = await Promise.all([
        // Количество заказов
        prisma.order.count({
          where: { companyId },
        }),
        // Количество клиентов
        prisma.customer.count({
          where: { companyId },
        }),
        // Количество товаров
        prisma.product.count({
          where: { companyId },
        }),
        // Количество счетов
        prisma.invoice.count({
          where: { companyId },
        }),
        // Завершенные заказы для расчета выручки
        prisma.order.findMany({
          where: {
            companyId,
            status: 'COMPLETED',
          },
          select: {
            totalAmount: true,
          },
          take: 1000, // Ограничиваем для производительности
        }),
        // Количество поставщиков
        prisma.supplier.count({
          where: { companyId },
        }),
        // Количество складов
        prisma.warehouse.count({
          where: { companyId },
        }),
        // Количество платежей
        prisma.payment.count({
          where: { companyId },
        }),
        // Заказы в работе
        prisma.order.count({
          where: {
            companyId,
            status: { in: ['PENDING', 'IN_PROGRESS'] },
          },
        }),
        // Неоплаченные счета
        prisma.invoice.count({
          where: {
            companyId,
            status: { in: ['ISSUED', 'PARTIALLY_PAID', 'OVERDUE'] },
          },
        }),
      ]);

      // Расчет общей выручки
      const totalRevenue = completedOrders.reduce(
        (sum, order) => sum + Number(order.totalAmount || 0),
        0
      );

      // Расчет суммы неоплаченных счетов
      const unpaidInvoicesData = await prisma.invoice.findMany({
        where: {
          companyId,
          status: { in: ['ISSUED', 'PARTIALLY_PAID', 'OVERDUE'] },
        },
        select: {
          totalAmount: true,
          paidAmount: true,
        },
      });

      const unpaidAmount = unpaidInvoicesData.reduce(
        (sum, invoice) => sum + (Number(invoice.totalAmount) - Number(invoice.paidAmount)),
        0
      );

      // Получаем последние 5 заказов
      const recentOrders = await prisma.order.findMany({
        where: { companyId },
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          orderNumber: true,
          totalAmount: true,
          currency: true,
          status: true,
          createdAt: true,
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
        },
      });

      return {
        stats: {
          orders: ordersCount,
          customers: customersCount,
          products: productsCount,
          invoices: invoicesCount,
          suppliers: suppliersCount,
          warehouses: warehousesCount,
          payments: paymentsCount,
          pendingOrders,
          unpaidInvoices,
          revenue: totalRevenue,
          unpaidAmount,
        },
        recentOrders,
      };
    } catch (error) {
      logger.error('Error fetching dashboard stats', { error, companyId });
      throw error;
    }
  }
}

