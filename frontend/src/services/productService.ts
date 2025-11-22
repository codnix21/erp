import api from './api';
import { ApiResponse, Product } from '../types';

interface CreateProductData {
  name: string;
  sku?: string;
  description?: string;
  categoryId?: string;
  unit?: string;
  price: number;
  currency?: string;
  taxRate?: number;
  isService?: boolean;
}

interface GetProductsParams {
  page?: number;
  limit?: number;
  categoryId?: string;
  search?: string;
  isService?: boolean;
}

export const productService = {
  getAll: async (params?: GetProductsParams): Promise<ApiResponse<Product[]>> => {
    const response = await api.get<ApiResponse<Product[]>>('/products', { params });
    return response.data;
  },

  getOne: async (id: string): Promise<ApiResponse<Product>> => {
    const response = await api.get<ApiResponse<Product>>(`/products/${id}`);
    return response.data;
  },

  create: async (data: CreateProductData): Promise<ApiResponse<Product>> => {
    const response = await api.post<ApiResponse<Product>>('/products', data);
    return response.data;
  },

  update: async (id: string, data: Partial<CreateProductData>): Promise<ApiResponse<Product>> => {
    const response = await api.put<ApiResponse<Product>>(`/products/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/products/${id}`);
  },
};

