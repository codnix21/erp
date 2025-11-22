import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { paymentService } from '../services/paymentService';
import { Plus, Search, CreditCard } from 'lucide-react';
import { usePermissions } from '../hooks/usePermissions';

const paymentMethodLabels: Record<string, string> = {
  CASH: 'Наличные',
  BANK_TRANSFER: 'Банковский перевод',
  CARD: 'Карта',
  ELECTRONIC: 'Электронный',
  OTHER: 'Другое',
};

export default function PaymentsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const { hasPermission } = usePermissions();

  const { data, isLoading, error } = useQuery({
    queryKey: ['payments', page, search],
    queryFn: () => paymentService.getAll({ page, limit: 20 }),
  });

  if (isLoading) return <div className="text-center py-8">Загрузка...</div>;
  if (error) return <div className="text-center py-8 text-red-600">Ошибка загрузки платежей</div>;

  const payments = data?.data || [];
  const meta = data?.meta;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <CreditCard className="w-8 h-8" />
          Платежи
        </h1>
        {hasPermission('payments:create') && (
          <Link to="/payments/new" className="btn btn-primary flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Добавить платёж
          </Link>
        )}
      </div>

      <div className="card mb-6">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Поиск по номеру счёта, референсу..."
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
              <th>Дата</th>
              <th>Сумма</th>
              <th>Валюта</th>
              <th>Способ оплаты</th>
              <th>Счёт</th>
              <th>Референс</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {payments.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-gray-500">
                  Платежи не найдены
                </td>
              </tr>
            ) : (
              payments.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td>{new Date(payment.paymentDate).toLocaleDateString('ru-RU')}</td>
                  <td className="font-medium">
                    {Number(payment.amount).toLocaleString('ru-RU')} {payment.currency}
                  </td>
                  <td>{payment.currency}</td>
                  <td>{paymentMethodLabels[payment.paymentMethod] || payment.paymentMethod}</td>
                  <td>
                    {payment.invoice ? (
                      <Link
                        to={`/invoices/${payment.invoiceId}`}
                        className="text-primary-600 hover:text-primary-700"
                      >
                        {payment.invoice.invoiceNumber}
                      </Link>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td>{payment.reference || '-'}</td>
                  <td>
                    <Link
                      to={`/payments/${payment.id}/edit`}
                      className="text-primary-600 hover:text-primary-700 font-medium"
                    >
                      Редактировать
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

