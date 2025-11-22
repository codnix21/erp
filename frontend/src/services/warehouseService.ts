import api from './api';

export interface Warehouse {
  id: string;
  name: string;
  address?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CreateWarehouseData {
  name: string;
  address?: string;
}

interface UpdateWarehouseData {
  name?: string;
  address?: string;
  isActive?: boolean;
}

export const warehouseService = {
  async getAll(params?: { page?: number; limit?: number; search?: string }) {
    const response = await api.get<{ success: boolean; data: Warehouse[]; meta?: any }>('/warehouses', {
      params,
    });
    return response.data;
  },

  async getOne(id: string) {
    const response = await api.get<{ success: boolean; data: Warehouse }>(`/warehouses/${id}`);
    return response.data;
  },

  async create(data: CreateWarehouseData) {
    const response = await api.post<{ success: boolean; data: Warehouse }>('/warehouses', data);
    return response.data;
  },

  async update(id: string, data: UpdateWarehouseData) {
    const response = await api.put<{ success: boolean; data: Warehouse }>(`/warehouses/${id}`, data);
    return response.data;
  },

  async delete(id: string) {
    const response = await api.delete<{ success: boolean }>(`/warehouses/${id}`);
    return response.data;
  },
};
