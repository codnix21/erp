import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { auditService } from '../services/auditService';
import api from '../services/api';
import { Eye, Download } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';

const actionLabels: Record<string, string> = {
  CREATE: 'Создание',
  UPDATE: 'Обновление',
  DELETE: 'Удаление',
};

const entityTypeLabels: Record<string, string> = {
  Order: 'Заказ',
  Product: 'Товар',
  Customer: 'Клиент',
  Invoice: 'Счёт',
  Payment: 'Платеж',
  Supplier: 'Поставщик',
  Warehouse: 'Склад',
  User: 'Пользователь',
  Company: 'Компания',
  Category: 'Категория',
};

const entityRoutes: Record<string, (id: string) => string> = {
  Order: (id) => `/orders/${id}`,
  Product: (id) => `/products/${id}`,
  Customer: (id) => `/customers/${id}`,
  Invoice: (id) => `/invoices/${id}`,
  Payment: (id) => `/payments/${id}`,
  Supplier: (id) => `/suppliers/${id}`,
  Warehouse: (id) => `/warehouses/${id}`,
  User: (id) => `/users/${id}`,
  Company: (id) => `/companies/${id}`,
  Category: (id) => `/categories/${id}`,
};

export default function AuditLogsPage() {
  const [page, setPage] = useState(1);
  const [entityType, setEntityType] = useState('');
  const [action, setAction] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const { error: showError } = useNotifications();

  const { data, isLoading, error } = useQuery({
    queryKey: ['audit-logs', page, entityType, action, startDate, endDate],
    queryFn: () =>
      auditService.getAll({
        page,
        limit: 50,
        entityType: entityType || undefined,
        action: action || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      }),
  });

  if (isLoading) {
    return <div className="text-center py-8">Загрузка...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-600">
        Ошибка загрузки логов аудита: {(error as any)?.response?.data?.error?.message || 'Неизвестная ошибка'}
      </div>
    );
  }

  const logs = data?.data || [];
  const meta = data?.meta || { total: 0, page: 1, limit: 50, totalPages: 0 };

  const handleExport = async () => {
    try {
      const params: any = {};
      if (entityType) params.entityType = entityType;
      if (action) params.action = action;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await api.get('/export/audit-logs/excel', {
        params,
        responseType: 'blob',
      });

      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `audit_logs_${Date.now()}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error: any) {
      showError(error?.response?.data?.error?.message || 'Ошибка экспорта логов');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Логи аудита</h1>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Download className="w-5 h-5" />
          Экспорт в Excel
        </button>
      </div>

      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Тип записи
            </label>
            <select
              value={entityType}
              onChange={(e) => setEntityType(e.target.value)}
              className="input"
            >
              <option value="">Все</option>
              <option value="Order">Заказы</option>
              <option value="Product">Товары</option>
              <option value="Customer">Клиенты</option>
              <option value="Invoice">Счета</option>
              <option value="Payment">Платежи</option>
              <option value="Supplier">Поставщики</option>
              <option value="Warehouse">Склады</option>
              <option value="User">Пользователи</option>
              <option value="Company">Компании</option>
              <option value="Category">Категории</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Действие
            </label>
            <select
              value={action}
              onChange={(e) => setAction(e.target.value)}
              className="input"
            >
              <option value="">Все</option>
              <option value="CREATE">Создание</option>
              <option value="UPDATE">Обновление</option>
              <option value="DELETE">Удаление</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Начало периода
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Конец периода
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="input"
            />
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="table">
          <thead>
            <tr>
              <th>Дата</th>
              <th>Пользователь</th>
              <th>Действие</th>
              <th>Тип записи</th>
              <th>ID записи</th>
              <th>IP адрес</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-gray-500">
                  Логи не найдены
                </td>
              </tr>
            ) : (
              logs.map((log: any) => {
                const formatDateTime = (dateString: string | Date | null | undefined) => {
                  if (!dateString) return '-';
                  try {
                    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
                    if (isNaN(date.getTime())) return '-';
                    return date.toLocaleString('ru-RU', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    });
                  } catch {
                    return '-';
                  }
                };

                return (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td>{formatDateTime(log.createdAt)}</td>
                  <td>
                    {log.user
                      ? `${log.user.firstName || ''} ${log.user.lastName || ''}`.trim() ||
                        log.user.email
                      : 'Система'}
                  </td>
                  <td>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        log.action === 'CREATE'
                          ? 'bg-green-100 text-green-800'
                          : log.action === 'UPDATE'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {actionLabels[log.action] || log.action}
                    </span>
                  </td>
                  <td>
                    <span className="font-medium">{entityTypeLabels[log.entityType] || log.entityType}</span>
                  </td>
                  <td className="font-mono text-xs text-gray-500">
                    {log.entityId ? (
                      entityRoutes[log.entityType] ? (
                        <Link
                          to={entityRoutes[log.entityType](log.entityId)}
                          className="text-primary-600 hover:underline"
                          title={log.entityId}
                        >
                          {log.entityId.substring(0, 8)}...
                        </Link>
                      ) : (
                        <span className="cursor-help" title={log.entityId}>
                          {log.entityId.substring(0, 8)}...
                        </span>
                      )
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="text-sm text-gray-600">{log.ipAddress || '-'}</td>
                  <td>
                    <Link
                      to={`/audit-logs/${log.id}`}
                      className="text-primary-600 hover:text-primary-700"
                      title="Просмотр деталей"
                    >
                      <Eye className="w-5 h-5" />
                    </Link>
                  </td>
                </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {meta.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="btn btn-secondary"
          >
            Назад
          </button>
          <span className="flex items-center px-4">
            Страница {meta.page} из {meta.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
            disabled={page === meta.totalPages}
            className="btn btn-secondary"
          >
            Вперёд
          </button>
        </div>
      )}
    </div>
  );
}

