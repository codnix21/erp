import api from './api';

export interface Category {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  companyId: string;
  createdAt: string;
  updatedAt: string;
  parent?: {
    id: string;
    name: string;
  };
  children?: Array<{
    id: string;
    name: string;
  }>;
  _count?: {
    children: number;
    products: number;
  };
}

export interface CreateCategoryData {
  name: string;
  description?: string;
  parentId?: string;
}

export interface UpdateCategoryData {
  name?: string;
  description?: string;
  parentId?: string | null;
}

export interface GetCategoriesParams {
  parentId?: string | null;
  search?: string;
}

export const categoryService = {
  async getAll(params?: GetCategoriesParams): Promise<{ data: Category[] }> {
    const response = await api.get('/categories', { params });
    return response.data;
  },

  async getOne(id: string): Promise<{ data: Category }> {
    const response = await api.get(`/categories/${id}`);
    return response.data;
  },

  async create(data: CreateCategoryData): Promise<{ data: Category }> {
    const response = await api.post('/categories', data);
    return response.data;
  },

  async update(id: string, data: UpdateCategoryData): Promise<{ data: Category }> {
    const response = await api.put(`/categories/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/categories/${id}`);
  },
};

