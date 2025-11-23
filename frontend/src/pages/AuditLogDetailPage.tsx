import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { auditService } from '../services/auditService';
import { ArrowLeft, Eye, User, MapPin, Monitor } from 'lucide-react';

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

export default function AuditLogDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading, error } = useQuery({
    queryKey: ['audit-log', id],
    queryFn: () => auditService.getOne(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return <div className="text-center py-8">Загрузка...</div>;
  }

  if (error || !data?.data) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">Лог аудита не найден</p>
        <Link to="/audit-logs" className="text-primary-600 hover:underline">
          Вернуться к логам
        </Link>
      </div>
    );
  }

  const log = data.data;
  const entityRoute = entityRoutes[log.entityType];

  const renderJsonValue = (value: any, depth = 0): React.ReactNode => {
    if (value === null || value === undefined) {
      return <span className="text-gray-400">null</span>;
    }

    if (typeof value === 'string') {
      return <span className="text-green-700">"{value}"</span>;
    }

    if (typeof value === 'number') {
      return <span className="text-blue-700">{value}</span>;
    }

    if (typeof value === 'boolean') {
      return <span className="text-purple-700">{value ? 'true' : 'false'}</span>;
    }

    if (Array.isArray(value)) {
      return (
        <div style={{ marginLeft: `${depth * 20}px` }}>
          <span className="text-gray-600">[</span>
          {value.map((item, index) => (
            <div key={index} style={{ marginLeft: '20px' }}>
              {renderJsonValue(item, depth + 1)}
              {index < value.length - 1 && <span className="text-gray-600">,</span>}
            </div>
          ))}
          <span className="text-gray-600">]</span>
        </div>
      );
    }

    if (typeof value === 'object') {
      const keys = Object.keys(value);
      if (keys.length === 0) {
        return <span className="text-gray-400">{'{}'}</span>;
      }
      return (
        <div style={{ marginLeft: `${depth * 20}px` }} className="font-mono text-sm">
          <span className="text-gray-600">{'{'}</span>
          {keys.map((key, index) => (
            <div key={key} style={{ marginLeft: '20px' }}>
              <span className="text-blue-600">"{key}"</span>
              <span className="text-gray-600">: </span>
              {renderJsonValue(value[key], depth + 1)}
              {index < keys.length - 1 && <span className="text-gray-600">,</span>}
            </div>
          ))}
          <span className="text-gray-600">{'}'}</span>
        </div>
      );
    }

    return <span>{String(value)}</span>;
  };

  return (
    <div>
      <Link
        to="/audit-logs"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Назад к логам
      </Link>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Детали лога аудита</h1>
        <span
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            log.action === 'CREATE'
              ? 'bg-green-100 text-green-800'
              : log.action === 'UPDATE'
              ? 'bg-blue-100 text-blue-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {actionLabels[log.action] || log.action}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="card">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Eye className="w-6 h-6" />
            Основная информация
          </h2>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-500">Тип записи</label>
              <p className="text-gray-900 font-medium">
                {entityTypeLabels[log.entityType] || log.entityType}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">ID записи</label>
              <div className="flex items-center gap-2">
                <p className="text-gray-900 font-mono text-sm">{log.entityId}</p>
                {entityRoute && (
                  <Link
                    to={entityRoute(log.entityId)}
                    className="text-primary-600 hover:underline text-sm"
                  >
                    Перейти к записи
                  </Link>
                )}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Действие</label>
              <p className="text-gray-900">
                {actionLabels[log.action] || log.action}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Дата и время</label>
              <p className="text-gray-900">
                {new Date(log.createdAt).toLocaleString('ru-RU', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <User className="w-6 h-6" />
            Пользователь
          </h2>
          <div className="space-y-3">
            {log.user ? (
              <>
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <p className="text-gray-900">{log.user.email}</p>
                </div>
                {(log.user.firstName || log.user.lastName) && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Имя</label>
                    <p className="text-gray-900">
                      {`${log.user.firstName || ''} ${log.user.lastName || ''}`.trim()}
                    </p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-500">ID пользователя</label>
                  <Link
                    to={`/users/${log.user.id}`}
                    className="text-primary-600 hover:underline font-mono text-sm"
                  >
                    {log.user.id}
                  </Link>
                </div>
              </>
            ) : (
              <p className="text-gray-500">Система</p>
            )}
          </div>
        </div>
      </div>

      {(log.ipAddress || log.userAgent) && (
        <div className="card mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Monitor className="w-6 h-6" />
            Техническая информация
          </h2>
          <div className="space-y-3">
            {log.ipAddress && (
              <div>
                <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  IP адрес
                </label>
                <p className="text-gray-900 font-mono">{log.ipAddress}</p>
              </div>
            )}
            {log.userAgent && (
              <div>
                <label className="text-sm font-medium text-gray-500">User Agent</label>
                <p className="text-gray-900 text-sm font-mono break-all">{log.userAgent}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {(log.oldValues || log.newValues) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {log.oldValues && (
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">Старые значения</h2>
              <div className="bg-gray-50 p-4 rounded-lg overflow-auto max-h-96">
                {renderJsonValue(log.oldValues)}
              </div>
            </div>
          )}
          {log.newValues && (
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">Новые значения</h2>
              <div className="bg-gray-50 p-4 rounded-lg overflow-auto max-h-96">
                {renderJsonValue(log.newValues)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

