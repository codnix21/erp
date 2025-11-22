import api from './api';
import { ApiResponse, Invoice } from '../types';

interface CreateInvoiceData {
  orderId?: string;
  status?: string;
  currency?: string;
  dueDate?: string;
  notes?: string;
}

interface GetInvoicesParams {
  page?: number;
  limit?: number;
  status?: string;
  orderId?: string;
  search?: string;
}

export const invoiceService = {
  getAll: async (params?: GetInvoicesParams): Promise<ApiResponse<Invoice[]>> => {
    const response = await api.get<ApiResponse<Invoice[]>>('/invoices', { params });
    return response.data;
  },

  getOne: async (id: string): Promise<ApiResponse<Invoice>> => {
    const response = await api.get<ApiResponse<Invoice>>(`/invoices/${id}`);
    return response.data;
  },

  create: async (data: CreateInvoiceData): Promise<ApiResponse<Invoice>> => {
    const response = await api.post<ApiResponse<Invoice>>('/invoices', data);
    return response.data;
  },

  update: async (id: string, data: Partial<CreateInvoiceData>): Promise<ApiResponse<Invoice>> => {
    const response = await api.put<ApiResponse<Invoice>>(`/invoices/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/invoices/${id}`);
  },
};

