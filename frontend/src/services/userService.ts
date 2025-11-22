import api from './api';
import { ApiResponse } from '../types';

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  userCompanyRoles?: Array<{
    id: string;
    companyId: string;
    roleId: string;
    isActive: boolean;
    company: {
      id: string;
      name: string;
    };
    role: {
      id: string;
      name: string;
      description?: string;
    };
  }>;
}

export interface CreateUserInput {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  companyId: string;
  roleId: string;
}

export interface UpdateUserInput {
  email?: string;
  firstName?: string;
  lastName?: string;
  isActive?: boolean;
}

export interface AssignRoleInput {
  companyId: string;
  roleId: string;
}

class UserService {
  async getAll(params?: { page?: number; limit?: number; search?: string; companyId?: string }) {
    const response = await api.get<ApiResponse<User[]>>('/users', { params });
    return response.data;
  }

  async getOne(id: string) {
    const response = await api.get<ApiResponse<User>>(`/users/${id}`);
    return response.data;
  }

  async create(data: CreateUserInput) {
    const response = await api.post<ApiResponse<User>>('/users', data);
    return response.data;
  }

  async update(id: string, data: UpdateUserInput) {
    const response = await api.put<ApiResponse<User>>(`/users/${id}`, data);
    return response.data;
  }

  async delete(id: string) {
    const response = await api.delete<ApiResponse<void>>(`/users/${id}`);
    return response.data;
  }

  async assignRole(id: string, data: AssignRoleInput) {
    const response = await api.post<ApiResponse<void>>(`/users/${id}/assign-role`, data);
    return response.data;
  }

  async removeRole(id: string, roleId: string) {
    const response = await api.delete<ApiResponse<void>>(`/users/${id}/roles/${roleId}`);
    return response.data;
  }
}

export const userService = new UserService();

