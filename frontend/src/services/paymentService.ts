import api from './api';

export interface Payment {
  id: string;
  invoiceId?: string;
  amount: number;
  currency: string;
  paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'CARD' | 'ELECTRONIC' | 'OTHER';
  paymentDate: string;
  reference?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  invoice?: {
    id: string;
    invoiceNumber: string;
    totalAmount: number | string;
    paidAmount: number | string;
    currency: string;
  };
}

interface CreatePaymentData {
  invoiceId?: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  paymentDate: string;
  reference?: string;
  notes?: string;
}

interface UpdatePaymentData {
  invoiceId?: string;
  amount?: number;
  currency?: string;
  paymentMethod?: string;
  paymentDate?: string;
  reference?: string;
  notes?: string;
}

export const paymentService = {
  async getAll(params?: { page?: number; limit?: number; invoiceId?: string }) {
    const response = await api.get<{ success: boolean; data: Payment[]; meta?: any }>('/payments', {
      params,
    });
    return response.data;
  },

  async getOne(id: string) {
    const response = await api.get<{ success: boolean; data: Payment }>(`/payments/${id}`);
    return response.data;
  },

  async create(data: CreatePaymentData) {
    const response = await api.post<{ success: boolean; data: Payment }>('/payments', data);
    return response.data;
  },

  async update(id: string, data: UpdatePaymentData) {
    const response = await api.put<{ success: boolean; data: Payment }>(`/payments/${id}`, data);
    return response.data;
  },

  async delete(id: string) {
    const response = await api.delete<{ success: boolean }>(`/payments/${id}`);
    return response.data;
  },
};

