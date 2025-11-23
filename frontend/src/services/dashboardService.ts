import api from './api';

export interface DashboardStats {
  stats: {
    orders: number;
    customers: number;
    products: number;
    invoices: number;
    suppliers: number;
    warehouses: number;
    payments: number;
    pendingOrders: number;
    unpaidInvoices: number;
    revenue: number;
    unpaidAmount: number;
  };
  recentOrders: Array<{
    id: string;
    orderNumber: string;
    totalAmount: number;
    currency: string;
    status: string;
    createdAt: string;
    customer?: { id: string; name: string };
    supplier?: { id: string; name: string };
  }>;
}

export const dashboardService = {
  async getStats(): Promise<{ success: boolean; data: DashboardStats }> {
    const response = await api.get<{ success: boolean; data: DashboardStats }>('/dashboard/stats');
    return response.data;
  },
};

