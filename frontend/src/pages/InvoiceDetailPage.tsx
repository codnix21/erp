import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { Invoice } from '../types';
import { ArrowLeft, FileText, CheckCircle, XCircle, Plus, Download, Printer } from 'lucide-react';
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

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { hasPermission } = usePermissions();
  const { error: showError } = useNotifications();

  const { data, isLoading, error } = useQuery({
    queryKey: ['invoice', id],
    queryFn: async () => {
      const response = await api.get(`/invoices/${id}`);
      return response.data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return <div className="text-center py-8">Загрузка...</div>;
  }

  if (error || !data?.data) {
    return (
      <div className="text-center py-8 text-red-600">
        Ошибка загрузки счёта или счёт не найден
      </div>
    );
  }

  const invoice: Invoice & { order?: any; payments?: any[] } = data.data;

  const handleExportPDF = async () => {
    try {
      const response = await api.get(`/export/invoices/${id}/pdf`, {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `invoice_${invoice.invoiceNumber || id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error?.message || 'Ошибка экспорта PDF';
      showError(`Не удалось экспортировать счёт: ${errorMessage}`);
    }
  };

  const handlePrintPDF = async () => {
    try {
      const response = await api.get(`/export/invoices/${id}/pdf`, {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const blobUrl = window.URL.createObjectURL(blob);
      const printWindow = window.open(blobUrl, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error?.message || 'Ошибка печати PDF';
      showError(`Не удалось распечатать счёт: ${errorMessage}`);
    }
  };
  const paidPercentage = (Number(invoice.paidAmount) / Number(invoice.totalAmount)) * 100;

  return (
    <div>
      <Link
        to="/invoices"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Назад к счетам
      </Link>

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Счёт {invoice.invoiceNumber}</h1>
          <p className="text-gray-600 mt-1">
            {invoice.issuedDate
              ? `Выставлен ${new Date(invoice.issuedDate).toLocaleDateString('ru-RU')}`
              : 'Черновик'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-2">
            <button
              onClick={handleExportPDF}
              className="btn btn-secondary flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Скачать PDF
            </button>
            <button
              onClick={handlePrintPDF}
              className="btn btn-secondary flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              Печать
            </button>
          </div>
          {hasPermission('payments:create') && (
            <Link
              to={`/payments/new?invoiceId=${invoice.id}`}
              className="btn btn-primary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Добавить платёж
            </Link>
          )}
          <span
            className={`px-4 py-2 rounded-full text-sm font-medium ${
              statusColors[invoice.status] || statusColors.DRAFT
            }`}
          >
            {statusLabels[invoice.status] || (invoice.status ? 'Неизвестный статус' : 'Без статуса')}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {invoice.order && (
            <div className="card mb-6">
              <h2 className="text-xl font-semibold mb-4">Связанный заказ</h2>
              <Link
                to={`/orders/${invoice.order.id}`}
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                {invoice.order.orderNumber}
              </Link>
            </div>
          )}

          {invoice.payments && invoice.payments.length > 0 && (
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">Платежи</h2>
              <div className="space-y-3">
                {invoice.payments.map((payment: any) => (
                  <div
                    key={payment.id}
                    className="flex justify-between items-center p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">
                        {Number(payment.amount).toLocaleString('ru-RU')} {payment.currency}
                      </p>
                      <p className="text-sm text-gray-600">
                        {new Date(payment.paymentDate).toLocaleDateString('ru-RU')} -{' '}
                        {payment.paymentMethod}
                      </p>
                    </div>
                    {payment.reference && (
                      <p className="text-sm text-gray-600">{payment.reference}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div>
          <div className="card mb-6">
            <h2 className="text-xl font-semibold mb-4">Финансовая информация</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Общая сумма</p>
                <p className="text-2xl font-bold text-primary-600">
                  {Number(invoice.totalAmount).toLocaleString('ru-RU')} {invoice.currency}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Оплачено</p>
                <p className="text-xl font-medium">
                  {Number(invoice.paidAmount).toLocaleString('ru-RU')} {invoice.currency}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Остаток</p>
                <p className="text-xl font-medium">
                  {(
                    Number(invoice.totalAmount) - Number(invoice.paidAmount)
                  ).toLocaleString('ru-RU')}{' '}
                  {invoice.currency}
                </p>
              </div>
              <div className="pt-3 border-t">
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div
                    className="bg-primary-600 h-2 rounded-full"
                    style={{ width: `${Math.min(paidPercentage, 100)}%` }}
                  />
                </div>
                <p className="text-sm text-gray-600">
                  Оплачено {paidPercentage.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>

          {invoice.dueDate && (
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">Срок оплаты</h2>
              <p className="text-lg">
                {new Date(invoice.dueDate).toLocaleDateString('ru-RU')}
              </p>
              {new Date(invoice.dueDate) < new Date() && invoice.status !== 'PAID' && (
                <p className="text-sm text-red-600 mt-2">Просрочен</p>
              )}
            </div>
          )}

          {invoice.notes && (
            <div className="card mt-6">
              <h2 className="text-xl font-semibold mb-4">Примечания</h2>
              <p className="text-gray-700">{invoice.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

