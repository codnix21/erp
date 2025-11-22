import api from './api';

export interface Supplier {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  taxId?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CreateSupplierData {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  taxId?: string;
  notes?: string;
}

interface UpdateSupplierData {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  taxId?: string;
  notes?: string;
  isActive?: boolean;
}

export const supplierService = {
  async getAll(params?: { page?: number; limit?: number; search?: string }) {
    const response = await api.get<{ success: boolean; data: Supplier[]; meta?: any }>('/suppliers', {
      params,
    });
    return response.data;
  },

  async getOne(id: string) {
    const response = await api.get<{ success: boolean; data: Supplier }>(`/suppliers/${id}`);
    return response.data;
  },

  async create(data: CreateSupplierData) {
    const response = await api.post<{ success: boolean; data: Supplier }>('/suppliers', data);
    return response.data;
  },

  async update(id: string, data: UpdateSupplierData) {
    const response = await api.put<{ success: boolean; data: Supplier }>(`/suppliers/${id}`, data);
    return response.data;
  },

  async delete(id: string) {
    const response = await api.delete<{ success: boolean }>(`/suppliers/${id}`);
    return response.data;
  },
};

