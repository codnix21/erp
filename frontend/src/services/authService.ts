import api from './api';
import { ApiResponse, User } from '../types';

interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

interface RegisterData {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

interface LoginData {
  email: string;
  password: string;
}

export const authService = {
  register: async (data: RegisterData): Promise<ApiResponse<User>> => {
    const response = await api.post<ApiResponse<User>>('/auth/register', data);
    return response.data;
  },

  login: async (data: LoginData): Promise<ApiResponse<LoginResponse>> => {
    const response = await api.post<ApiResponse<LoginResponse>>('/auth/login', data);
    return response.data;
  },

  logout: async (refreshToken: string): Promise<void> => {
    await api.post('/auth/logout', { refreshToken });
  },

  me: async (): Promise<ApiResponse<User>> => {
    const response = await api.get<ApiResponse<User>>('/auth/me');
    return response.data;
  },
};

