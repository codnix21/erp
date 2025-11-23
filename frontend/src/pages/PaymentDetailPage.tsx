import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { paymentService } from '../services/paymentService';
import { ArrowLeft, Edit, Trash2, CreditCard, Receipt } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { usePermissions } from '../hooks/usePermissions';

const paymentMethodLabels: Record<string, string> = {
  CASH: 'Наличные',
  BANK_TRANSFER: 'Банковский перевод',
  CARD: 'Карта',
  ELECTRONIC: 'Электронный',
  OTHER: 'Другое',
};

export default function PaymentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { success, error: showError } = useNotifications();
  const { hasPermission } = usePermissions();

  const { data, isLoading, error } = useQuery({
    queryKey: ['payment', id],
    queryFn: () => paymentService.getOne(id!),
    enabled: !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: () => paymentService.delete(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      success('Платёж удалён');
      navigate('/payments');
    },
    onError: (err: any) => {
      showError(err.response?.data?.error?.message || 'Ошибка при удалении платежа');
    },
  });

  const handleDelete = () => {
    if (window.confirm('Вы уверены, что хотите удалить этот платёж?')) {
      deleteMutation.mutate();
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Загрузка...</div>;
  }

  if (error || !data?.data) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">Платёж не найден</p>
        <Link to="/payments" className="text-primary-600 hover:underline">
          Вернуться к платежам
        </Link>
      </div>
    );
  }

  const payment = data.data;

  return (
    <div>
      <Link
        to="/payments"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Назад к платежам
      </Link>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Платёж #{payment.id.slice(0, 8)}</h1>
        <div className="flex gap-2">
          {hasPermission('payments:update') && (
            <Link
              to={`/payments/${id}/edit`}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Edit className="w-5 h-5" />
              Редактировать
            </Link>
          )}
          {hasPermission('payments:delete') && (
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              disabled={deleteMutation.isPending}
            >
              <Trash2 className="w-5 h-5" />
              {deleteMutation.isPending ? 'Удаление...' : 'Удалить'}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <CreditCard className="w-6 h-6" />
            Основная информация
          </h2>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-500">Дата платежа</label>
              <p className="text-gray-900">
                {new Date(payment.paymentDate).toLocaleDateString('ru-RU', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Сумма</label>
              <p className="text-2xl font-bold text-primary-600">
                {Number(payment.amount).toLocaleString('ru-RU', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{' '}
                {payment.currency}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Способ оплаты</label>
              <p className="text-gray-900">
                {paymentMethodLabels[payment.paymentMethod] || payment.paymentMethod}
              </p>
            </div>
            {payment.reference && (
              <div>
                <label className="text-sm font-medium text-gray-500">Референс</label>
                <p className="text-gray-900 font-mono">{payment.reference}</p>
              </div>
            )}
            {payment.notes && (
              <div>
                <label className="text-sm font-medium text-gray-500">Примечания</label>
                <p className="text-gray-900">{payment.notes}</p>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-gray-500">Дата создания</label>
              <p className="text-gray-900">
                {new Date(payment.createdAt).toLocaleDateString('ru-RU')}
              </p>
            </div>
          </div>
        </div>

        {payment.invoice && (
          <div className="card">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Receipt className="w-6 h-6" />
              Связанный счёт
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">Номер счёта</label>
                <Link
                  to={`/invoices/${payment.invoiceId}`}
                  className="text-primary-600 hover:underline font-medium"
                >
                  {payment.invoice.invoiceNumber}
                </Link>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Сумма счёта</label>
                <p className="text-gray-900">
                  {Number(payment.invoice.totalAmount).toLocaleString('ru-RU', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{' '}
                  {payment.invoice.currency}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Оплачено</label>
                <p className="text-gray-900">
                  {Number(payment.invoice.paidAmount).toLocaleString('ru-RU', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{' '}
                  {payment.invoice.currency}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Остаток</label>
                <p className="text-gray-900">
                  {(
                    Number(payment.invoice.totalAmount) - Number(payment.invoice.paidAmount)
                  ).toLocaleString('ru-RU', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{' '}
                  {payment.invoice.currency}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

