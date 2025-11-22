import api from './api';
import { ApiResponse, Customer } from '../types';

interface CreateCustomerData {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  taxId?: string;
  notes?: string;
}

interface GetCustomersParams {
  page?: number;
  limit?: number;
  search?: string;
}

export const customerService = {
  getAll: async (params?: GetCustomersParams): Promise<ApiResponse<Customer[]>> => {
    const response = await api.get<ApiResponse<Customer[]>>('/customers', { params });
    return response.data;
  },

  getOne: async (id: string): Promise<ApiResponse<Customer>> => {
    const response = await api.get<ApiResponse<Customer>>(`/customers/${id}`);
    return response.data;
  },

  create: async (data: CreateCustomerData): Promise<ApiResponse<Customer>> => {
    const response = await api.post<ApiResponse<Customer>>('/customers', data);
    return response.data;
  },

  update: async (id: string, data: Partial<CreateCustomerData>): Promise<ApiResponse<Customer>> => {
    const response = await api.put<ApiResponse<Customer>>(`/customers/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/customers/${id}`);
  },
};

