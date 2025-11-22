import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../store/authStore';

const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 секунд таймаут
});

// Interceptor для добавления токена
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().accessToken;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Отладка
    console.log('[API Request]', config.method?.toUpperCase(), config.url, {
      hasToken: !!token,
      fullUrl: config.baseURL + config.url,
      headers: {
        Authorization: config.headers?.Authorization ? 'Bearer ***' : 'none',
        'Content-Type': config.headers?.['Content-Type'],
      },
    });
    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

// Interceptor для обработки ошибок и refresh token
api.interceptors.response.use(
  (response) => {
    // Отладка
    console.log('[API Response]', response.config.method?.toUpperCase(), response.config.url, {
      status: response.status,
      success: response.data?.success,
      hasData: !!response.data?.data,
      dataLength: Array.isArray(response.data?.data) ? response.data.data.length : 'not array',
    });
    return response;
  },
  async (error: AxiosError) => {
    // Отладка - ВСЕГДА логируем ошибки с полными деталями
    const errorDetails: any = {
      method: error.config?.method?.toUpperCase(),
      url: error.config?.url,
      fullUrl: error.config?.baseURL + error.config?.url,
      message: error.message,
      code: error.code,
      name: error.name,
    };

    if (error.response) {
      errorDetails.response = {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        headers: error.response.headers,
      };
    } else if (error.request) {
      errorDetails.request = {
        exists: true,
        readyState: (error.request as any)?.readyState,
        status: (error.request as any)?.status,
        statusText: (error.request as any)?.statusText,
      };
    }

    console.error('[API Error]', errorDetails);
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = useAuthStore.getState().refreshToken;
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        const response = await axios.post('/api/v1/auth/refresh', {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data.data;
        useAuthStore.getState().setAuth(
          useAuthStore.getState().user!,
          accessToken,
          newRefreshToken
        );

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }

        return api(originalRequest);
      } catch (refreshError) {
        useAuthStore.getState().logout();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;

