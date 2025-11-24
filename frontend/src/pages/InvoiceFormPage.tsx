import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invoiceService } from '../services/invoiceService';
import { orderService } from '../services/orderService';
import { Link } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';

const invoiceSchema = z.object({
  orderId: z.string().uuid().optional(),
  status: z.string().optional().default('DRAFT'),
  currency: z.string().optional().default('RUB'),
  dueDate: z.string().optional(),
  notes: z.string().optional(),
});

type InvoiceFormData = z.infer<typeof invoiceSchema>;

export default function InvoiceFormPage() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { success, error: showError } = useNotifications();
  const isEdit = !!id;

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema) as any,
    defaultValues: {
      status: 'DRAFT',
      currency: 'RUB',
    },
  });

  const { data: invoice, isLoading } = useQuery({
    queryKey: ['invoice', id],
    queryFn: () => invoiceService.getOne(id!),
    enabled: isEdit,
  });

  const { data: ordersData } = useQuery({
    queryKey: ['orders', 'for-invoice'],
    queryFn: () => orderService.getAll({ page: 1, limit: 100, status: 'COMPLETED' }),
  });

  useEffect(() => {
    if (invoice?.data) {
      setValue('orderId', invoice.data.orderId || '');
      setValue('status', invoice.data.status);
      setValue('currency', invoice.data.currency);
      setValue('dueDate', invoice.data.dueDate ? invoice.data.dueDate.split('T')[0] : '');
      setValue('notes', (invoice.data as any).notes || '');
    }
  }, [invoice, setValue]);

  const mutation = useMutation({
    mutationFn: (data: InvoiceFormData) => {
      const submitData = {
        ...data,
        dueDate: data.dueDate ? `${data.dueDate}T00:00:00Z` : undefined,
        orderId: data.orderId || undefined,
      };
      return isEdit ? invoiceService.update(id!, submitData) : invoiceService.create(submitData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      success(isEdit ? 'Счёт обновлён' : 'Счёт создан');
      navigate('/invoices');
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.error?.message || error?.message || 'Ошибка при сохранении счёта';
      showError(errorMessage);
    },
  });

  const onSubmit = (data: InvoiceFormData) => {
    mutation.mutate(data);
  };

  const orders = ordersData?.data || [];
  const selectedOrder = orders.find((o: any) => o.id === watch('orderId'));

  if (isEdit && isLoading) {
    return <div className="text-center py-8">Загрузка...</div>;
  }

  return (
    <div>
      <Link
        to="/invoices"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Назад к счетам
      </Link>

      <h1 className="text-3xl font-bold mb-6">
        {isEdit ? 'Редактировать счёт' : 'Создать счёт'}
      </h1>

      <form onSubmit={handleSubmit(onSubmit as any)} className="card max-w-2xl">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Заказ (опционально)
            </label>
            <select {...register('orderId')} className="input">
              <option value="">Без заказа</option>
              {orders.map((order: any) => (
                <option key={order.id} value={order.id}>
                  {order.orderNumber} - {order.customer?.name || order.supplier?.name} (
                  {Number(order.totalAmount).toLocaleString('ru-RU')} {order.currency})
                </option>
              ))}
            </select>
            {selectedOrder && (
              <p className="mt-2 text-sm text-gray-600">
                Сумма заказа: {Number(selectedOrder.totalAmount).toLocaleString('ru-RU')}{' '}
                {selectedOrder.currency}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Статус
              </label>
              <select {...register('status')} className="input">
                <option value="DRAFT">Черновик</option>
                <option value="ISSUED">Выставлен</option>
                <option value="PAID">Оплачен</option>
                <option value="PARTIALLY_PAID">Частично оплачен</option>
                <option value="OVERDUE">Просрочен</option>
                <option value="CANCELLED">Отменён</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Валюта
              </label>
              <select {...register('currency')} className="input">
                <option value="RUB">RUB</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Срок оплаты
            </label>
            <input type="date" {...register('dueDate')} className="input" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Примечания
            </label>
            <textarea
              {...register('notes')}
              className="input"
              rows={3}
              placeholder="Дополнительная информация"
            />
          </div>

          {mutation.isError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              Ошибка: {(mutation.error as any)?.response?.data?.error?.message || 'Неизвестная ошибка'}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={mutation.isPending}
              className="btn btn-primary flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {mutation.isPending ? 'Сохранение...' : 'Сохранить'}
            </button>
            <Link to="/invoices" className="btn btn-secondary">
              Отмена
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}

