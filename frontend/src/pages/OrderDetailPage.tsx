import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { orderService } from '../services/orderService';
import api from '../services/api';
import { ArrowLeft, Download, Printer } from 'lucide-react';

const statusLabels: Record<string, string> = {
  DRAFT: 'Черновик',
  PENDING: 'Ожидает',
  CONFIRMED: 'Подтверждён',
  IN_PROGRESS: 'В работе',
  COMPLETED: 'Завершён',
  CANCELLED: 'Отменён',
};

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading, error } = useQuery({
    queryKey: ['order', id],
    queryFn: () => orderService.getOne(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return <div className="text-center py-8">Загрузка...</div>;
  }

  if (error || !data?.data) {
    return (
      <div className="text-center py-8 text-red-600">
        Ошибка загрузки заказа или заказ не найден
      </div>
    );
  }

  const order = data.data;

  const handleExportPDF = async () => {
    try {
      const response = await api.get(`/export/orders/${id}/pdf`, {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `order_${order.orderNumber || id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error: any) {
      console.error('Export error:', error);
      const errorMessage = error?.response?.data?.error?.message || 'Ошибка экспорта PDF';
      alert(`Не удалось экспортировать заказ: ${errorMessage}`);
    }
  };

  const handlePrintPDF = async () => {
    try {
      const response = await api.get(`/export/orders/${id}/pdf`, {
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
      console.error('Print error:', error);
      const errorMessage = error?.response?.data?.error?.message || 'Ошибка печати PDF';
      alert(`Не удалось распечатать заказ: ${errorMessage}`);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <Link
          to="/orders"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800"
        >
          <ArrowLeft className="w-4 h-4" />
          Назад к заказам
        </Link>
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
      </div>

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Заказ {order.orderNumber}</h1>
          <p className="text-gray-600 mt-1">
            Создан {new Date(order.createdAt).toLocaleString('ru-RU')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Позиции заказа</h2>
            <table className="table">
              <thead>
                <tr>
                  <th>Товар</th>
                  <th>Количество</th>
                  <th>Цена</th>
                  <th>НДС</th>
                  <th>Итого</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => {
                  // Пересчитываем итого, если оно равно 0 (для старых данных)
                  const itemTotal = item.total || (item.quantity * item.price * (1 + item.taxRate / 100));
                  return (
                    <tr key={item.id}>
                      <td>{item.product?.name || 'Товар'}</td>
                      <td>{item.quantity}</td>
                      <td>{item.price.toLocaleString('ru-RU')} {order.currency}</td>
                      <td>{item.taxRate}%</td>
                      <td className="font-medium">
                        {itemTotal.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {order.currency}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="mt-4 pt-4 border-t flex justify-end">
              <div className="text-right">
                <p className="text-gray-600">Итого:</p>
                <p className="text-2xl font-bold text-primary-600">
                  {order.totalAmount.toLocaleString('ru-RU')} {order.currency}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="card mb-6">
            <h2 className="text-xl font-semibold mb-4">Информация</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Статус</p>
                <p className="font-medium">{statusLabels[order.status] || (order.status ? 'Неизвестный статус' : 'Без статуса')}</p>
              </div>
              {order.customer && (
                <div>
                  <p className="text-sm text-gray-600">Клиент</p>
                  <p className="font-medium">{order.customer.name}</p>
                </div>
              )}
              {order.supplier && (
                <div>
                  <p className="text-sm text-gray-600">Поставщик</p>
                  <p className="font-medium">{order.supplier.name}</p>
                </div>
              )}
              {order.dueDate && (
                <div>
                  <p className="text-sm text-gray-600">Срок выполнения</p>
                  <p className="font-medium">
                    {new Date(order.dueDate).toLocaleDateString('ru-RU')}
                  </p>
                </div>
              )}
            </div>
          </div>

          {order.notes && (
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">Примечания</h2>
              <p className="text-gray-700">{order.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

