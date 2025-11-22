import api from './api';
import { ApiResponse, Order } from '../types';

interface CreateOrderData {
  customerId?: string;
  supplierId?: string;
  status?: string;
  currency?: string;
  notes?: string;
  dueDate?: string;
  items: Array<{
    productId: string;
    quantity: number;
    price: number;
    taxRate?: number;
  }>;
}

interface GetOrdersParams {
  page?: number;
  limit?: number;
  status?: string;
  customerId?: string;
  supplierId?: string;
  search?: string;
}

export const orderService = {
  getAll: async (params?: GetOrdersParams): Promise<ApiResponse<Order[]>> => {
    const response = await api.get<ApiResponse<Order[]>>('/orders', { params });
    return response.data;
  },

  getOne: async (id: string): Promise<ApiResponse<Order>> => {
    const response = await api.get<ApiResponse<Order>>(`/orders/${id}`);
    return response.data;
  },

  create: async (data: CreateOrderData): Promise<ApiResponse<Order>> => {
    const response = await api.post<ApiResponse<Order>>('/orders', data);
    return response.data;
  },

  update: async (id: string, data: Partial<CreateOrderData>): Promise<ApiResponse<Order>> => {
    const response = await api.put<ApiResponse<Order>>(`/orders/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/orders/${id}`);
  },
};

