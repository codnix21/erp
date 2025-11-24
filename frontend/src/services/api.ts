import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../store/authStore';
import { showError } from '../utils/notifications';

const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
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
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor для обработки ошибок и refresh token
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const status = error.response?.status;
    const errorData = error.response?.data as any;

    // Обработка 401 - попытка обновить токен
    if (status === 401 && !originalRequest._retry) {
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

    // Показываем уведомление об ошибке для других статусов
    // Не показываем для 401 (уже обработано выше) и для запросов с флагом _skipErrorNotification
    if (status && status !== 401 && !(originalRequest as any)?._skipErrorNotification) {
      const errorMessage = 
        errorData?.error?.message || 
        errorData?.message || 
        error.message ||
        getDefaultErrorMessage(status);
      
      showError(errorMessage);
    }

    return Promise.reject(error);
  }
);

// Функция для получения сообщения об ошибке по умолчанию
function getDefaultErrorMessage(status: number): string {
  const messages: Record<number, string> = {
    400: 'Неверный запрос',
    403: 'Доступ запрещён',
    404: 'Ресурс не найден',
    409: 'Конфликт данных',
    422: 'Ошибка валидации',
    429: 'Слишком много запросов',
    500: 'Внутренняя ошибка сервера',
    502: 'Ошибка шлюза',
    503: 'Сервис недоступен',
    504: 'Таймаут шлюза',
  };

  return messages[status] || `Ошибка ${status}`;
}

export default api;

