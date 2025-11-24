import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { orderService } from '../services/orderService';
import api from '../services/api';
import { Order } from '../types';
import { Plus, Search, Download } from 'lucide-react';
import { usePermissions } from '../hooks/usePermissions';
import { useNotifications } from '../context/NotificationContext';
import { useAuthStore } from '../store/authStore';

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-purple-100 text-purple-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

const statusLabels: Record<string, string> = {
  DRAFT: 'Черновик',
  PENDING: 'Ожидает',
  CONFIRMED: 'Подтверждён',
  IN_PROGRESS: 'В работе',
  COMPLETED: 'Завершён',
  CANCELLED: 'Отменён',
};

export default function OrdersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const { hasPermission } = usePermissions();
  const { error: showError } = useNotifications();
  const { isAuthenticated, accessToken } = useAuthStore();

  const handleExport = async () => {
    try {
      const response = await api.get('/export/orders/excel', {
        responseType: 'blob',
      });
      const blob = new Blob([response.data]);
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `orders_${Date.now()}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error: any) {
      showError(error?.response?.data?.error?.message || 'Ошибка экспорта');
    }
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ['orders', page, search, statusFilter],
    queryFn: () => orderService.getAll({ 
      page, 
      limit: 20, 
      search: search || undefined,
      status: statusFilter || undefined,
    }),
    enabled: isAuthenticated && !!accessToken,
  });

  if (isLoading) {
    return <div className="text-center py-8">Загрузка...</div>;
  }

  if (error) {
    const errorMessage = (error as any)?.response?.data?.error?.message || (error as any)?.message || 'Ошибка загрузки заказов';
    return (
      <div className="card text-center py-8">
        <div className="text-red-600 font-medium mb-2">Ошибка загрузки заказов</div>
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


  const orders = data?.data || [];
  const meta = data?.meta;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Заказы</h1>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="btn btn-secondary flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Экспорт
          </button>
          {hasPermission('orders:create') && (
            <Link to="/orders/new" className="btn btn-primary flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Создать заказ
            </Link>
          )}
        </div>
      </div>

      <div className="card mb-6">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Поиск по номеру заказа..."
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
              <th>Номер</th>
              <th>Клиент</th>
              <th>Статус</th>
              <th>Сумма</th>
              <th>Дата создания</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-gray-500">
                  Заказы не найдены
                </td>
              </tr>
            ) : (
              orders.map((order: Order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="font-medium">{order.orderNumber}</td>
                  <td>{order.customer?.name || order.supplier?.name || '-'}</td>
                  <td>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        statusColors[order.status] || statusColors.DRAFT
                      }`}
                    >
                      {statusLabels[order.status] || (order.status ? 'Неизвестный статус' : 'Без статуса')}
                    </span>
                  </td>
                  <td>
                    {order.totalAmount.toLocaleString('ru-RU')} {order.currency}
                  </td>
                  <td>
                    {(() => {
                      try {
                        const date = new Date(order.createdAt);
                        if (isNaN(date.getTime())) return '-';
                        return date.toLocaleDateString('ru-RU', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                        });
                      } catch {
                        return '-';
                      }
                    })()}
                  </td>
                  <td>
                    <Link
                      to={`/orders/${order.id}`}
                      className="text-primary-600 hover:text-primary-700 font-medium"
                    >
                      Открыть
                    </Link>
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

