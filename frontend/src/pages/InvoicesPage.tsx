import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { ApiResponse, Invoice } from '../types';
import { Plus, Search, FileText, Download } from 'lucide-react';
import { usePermissions } from '../hooks/usePermissions';
import { useNotifications } from '../context/NotificationContext';

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  ISSUED: 'bg-blue-100 text-blue-800',
  PAID: 'bg-green-100 text-green-800',
  PARTIALLY_PAID: 'bg-yellow-100 text-yellow-800',
  OVERDUE: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-gray-100 text-gray-800',
};

const statusLabels: Record<string, string> = {
  DRAFT: 'Черновик',
  ISSUED: 'Выставлен',
  PAID: 'Оплачен',
  PARTIALLY_PAID: 'Частично оплачен',
  OVERDUE: 'Просрочен',
  CANCELLED: 'Отменён',
};

export default function InvoicesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const { hasPermission } = usePermissions();
  const { error: showError } = useNotifications();

  const handleExport = async () => {
    try {
      const response = await api.get('/export/invoices/excel', {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `invoices_${Date.now()}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error?.message || 'Ошибка экспорта';
      showError(`Не удалось экспортировать счета: ${errorMessage}`);
    }
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ['invoices', page, search, statusFilter],
    queryFn: async () => {
      const response = await api.get<ApiResponse<Invoice[]>>('/invoices', {
        params: { 
          page, 
          limit: 20, 
          search: search || undefined,
          status: statusFilter || undefined,
        },
      });
      return response.data;
    },
  });

  if (isLoading) return <div className="text-center py-8">Загрузка...</div>;
  if (error) return <div className="text-center py-8 text-red-600">Ошибка загрузки счетов</div>;

  const invoices = data?.data || [];
  const meta = data?.meta;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <FileText className="w-8 h-8" />
          Счета
        </h1>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="btn btn-secondary flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Экспорт
          </button>
          {hasPermission('invoices:create') && (
            <Link to="/invoices/new" className="btn btn-primary flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Создать счёт
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
              placeholder="Поиск по номеру счёта..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-10"
            />
          </div>
          <div className="w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input"
            >
              <option value="">Все статусы</option>
              <option value="DRAFT">Черновик</option>
              <option value="ISSUED">Выставлен</option>
              <option value="PAID">Оплачен</option>
              <option value="PARTIALLY_PAID">Частично оплачен</option>
              <option value="OVERDUE">Просрочен</option>
              <option value="CANCELLED">Отменён</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="table">
          <thead>
            <tr>
              <th>Номер</th>
              <th>Статус</th>
              <th>Сумма</th>
              <th>Оплачено</th>
              <th>Валюта</th>
              <th>Срок оплаты</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {invoices.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-gray-500">
                  Счета не найдены
                </td>
              </tr>
            ) : (
              invoices.map((invoice: Invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50">
                  <td className="font-medium">{invoice.invoiceNumber}</td>
                  <td>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        statusColors[invoice.status] || statusColors.DRAFT
                      }`}
                    >
                      {statusLabels[invoice.status] || (invoice.status ? 'Неизвестный статус' : 'Без статуса')}
                    </span>
                  </td>
                  <td>{Number(invoice.totalAmount).toLocaleString('ru-RU')} {invoice.currency}</td>
                  <td>{Number(invoice.paidAmount).toLocaleString('ru-RU')} {invoice.currency}</td>
                  <td>{invoice.currency}</td>
                  <td>
                    {invoice.dueDate
                      ? new Date(invoice.dueDate).toLocaleDateString('ru-RU')
                      : '-'}
                  </td>
                  <td>
                    <Link
                      to={`/invoices/${invoice.id}`}
                      className="text-primary-600 hover:text-primary-700 font-medium mr-3"
                    >
                      Открыть
                    </Link>
                    {hasPermission('payments:create') && (
                      <Link
                        to={`/payments/new?invoiceId=${invoice.id}`}
                        className="text-green-600 hover:text-green-700 text-sm"
                      >
                        Оплатить
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

