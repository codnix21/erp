import prisma from '../config/database';
import logger from '../config/logger';

export class DashboardService {
  async getStats(companyId: string) {
    try {
      // Выполняем все запросы параллельно для максимальной производительности
      const [ordersCount, customersCount, productsCount, invoicesCount, completedOrders] = await Promise.all([
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
      ]);

      // Расчет общей выручки
      const totalRevenue = completedOrders.reduce(
        (sum, order) => sum + Number(order.totalAmount || 0),
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
          revenue: totalRevenue,
        },
        recentOrders,
      };
    } catch (error) {
      logger.error('Error fetching dashboard stats', { error, companyId });
      throw error;
    }
  }
}

