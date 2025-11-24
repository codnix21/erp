import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { ApiResponse } from '../types';
import { Plus, Search, Warehouse } from 'lucide-react';
import { usePermissions } from '../hooks/usePermissions';
import { useAuthStore } from '../store/authStore';

interface Warehouse {
  id: string;
  name: string;
  address?: string;
  isActive: boolean;
}

export default function WarehousesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const { hasPermission } = usePermissions();
  const { isAuthenticated, accessToken } = useAuthStore();

  const { data, isLoading, error } = useQuery({
    queryKey: ['warehouses', page, search],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Warehouse[]>>('/warehouses', {
        params: { page, limit: 20, search: search || undefined },
      });
      return response.data;
    },
    enabled: isAuthenticated && !!accessToken,
  });

  if (isLoading) return <div className="text-center py-8">Загрузка...</div>;
  if (error) {
    const errorMessage = (error as any)?.response?.data?.error?.message || (error as any)?.message || 'Ошибка загрузки складов';
    return (
      <div className="card text-center py-8">
        <div className="text-red-600 font-medium mb-2">Ошибка загрузки складов</div>
        <div className="text-sm text-gray-500">{errorMessage}</div>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 btn btn-secondary text-sm"
        >
          Обновить страницу
        </button>
      </div>
    );
  }

  const warehouses = (data?.success ? data.data : data?.data) || [];
  const meta = data?.meta;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Warehouse className="w-8 h-8" />
          Склады
        </h1>
        {hasPermission('warehouses:create') && (
          <Link to="/warehouses/new" className="btn btn-primary flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Добавить склад
          </Link>
        )}
      </div>

      <div className="card mb-6">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Поиск по названию, адресу..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-10"
            />
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="table">
          <thead>
            <tr>
              <th>Название</th>
              <th>Адрес</th>
              <th>Статус</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {warehouses.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-8 text-gray-500">
                  Склады не найдены
                </td>
              </tr>
            ) : (
              warehouses.map((warehouse: Warehouse) => (
                <tr key={warehouse.id} className="hover:bg-gray-50">
                  <td className="font-medium">{warehouse.name}</td>
                  <td>{warehouse.address || '-'}</td>
                  <td>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        warehouse.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {warehouse.isActive ? 'Активен' : 'Неактивен'}
                    </span>
                  </td>
                  <td>
                    <Link
                      to={`/warehouses/${warehouse.id}`}
                      className="text-primary-600 hover:text-primary-700 font-medium mr-3"
                    >
                      Открыть
                    </Link>
                    {hasPermission('warehouses:update') && (
                      <Link
                        to={`/warehouses/${warehouse.id}/edit`}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Редактировать
                      </Link>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {meta && meta.totalPages > 1 && (
          <div className="px-4 py-3 border-t flex justify-between items-center">
            <span className="text-sm text-gray-600">
              Страница {meta.page} из {meta.totalPages} (всего {meta.total})
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn btn-secondary text-sm disabled:opacity-50"
              >
                Назад
              </button>
              <button
                onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                disabled={page === meta.totalPages}
                className="btn btn-secondary text-sm disabled:opacity-50"
              >
                Вперёд
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

