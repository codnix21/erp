import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentService } from '../services/paymentService';
import { invoiceService } from '../services/invoiceService';
import { Link } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';

const paymentSchema = z.object({
  invoiceId: z.string().uuid().optional(),
  amount: z.number().positive('Сумма должна быть положительной'),
  currency: z.string().default('RUB'),
  paymentMethod: z.string(),
  paymentDate: z.string().min(1, 'Дата обязательна'),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

export default function PaymentFormPage() {
  const { id } = useParams<{ id?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = !!id;
  const invoiceIdFromQuery = searchParams.get('invoiceId');

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      currency: 'RUB',
      paymentMethod: 'BANK_TRANSFER',
      paymentDate: new Date().toISOString().split('T')[0],
      invoiceId: invoiceIdFromQuery || '',
    },
  });

  const { success } = useNotifications();

  const { data: payment, isLoading } = useQuery({
    queryKey: ['payment', id],
    queryFn: () => paymentService.getOne(id!),
    enabled: isEdit,
  });

  const { data: invoicesData } = useQuery({
    queryKey: ['invoices', 'for-payment'],
    queryFn: () => invoiceService.getAll({ page: 1, limit: 100 }),
  });

  useEffect(() => {
    if (payment?.data) {
      setValue('invoiceId', payment.data.invoiceId || '');
      setValue('amount', Number(payment.data.amount));
      setValue('currency', payment.data.currency);
      setValue('paymentMethod', payment.data.paymentMethod);
      setValue('paymentDate', payment.data.paymentDate.split('T')[0]);
      setValue('reference', payment.data.reference || '');
      setValue('notes', payment.data.notes || '');
    } else if (invoiceIdFromQuery) {
      setValue('invoiceId', invoiceIdFromQuery);
    }
  }, [payment, setValue, invoiceIdFromQuery]);

  const mutation = useMutation({
    mutationFn: async (data: PaymentFormData) => {
      const submitData = {
        ...data,
        paymentDate: `${data.paymentDate}T00:00:00Z`,
        invoiceId: data.invoiceId || undefined,
      };
      if (isEdit) {
        return paymentService.update(id!, submitData);
      } else {
        return paymentService.create(submitData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      success(isEdit ? 'Платёж обновлён' : 'Платёж создан');
      navigate('/payments');
    },
  });

  const onSubmit = (data: PaymentFormData) => {
    mutation.mutate(data);
  };

  const invoices = invoicesData?.data || [];
  const selectedInvoice = invoices.find((i: any) => i.id === watch('invoiceId'));

  if (isEdit && isLoading) {
    return <div className="text-center py-8">Загрузка...</div>;
  }

  return (
    <div>
      <Link
        to="/payments"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Назад к платежам
      </Link>

      <h1 className="text-3xl font-bold mb-6">
        {isEdit ? 'Редактировать платёж' : 'Создать платёж'}
      </h1>

      <form onSubmit={handleSubmit(onSubmit)} className="card max-w-2xl">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Счёт (опционально)
            </label>
            <select {...register('invoiceId')} className="input">
              <option value="">Без счёта</option>
              {invoices.map((invoice: any) => (
                <option key={invoice.id} value={invoice.id}>
                  {invoice.invoiceNumber} -{' '}
                  {(
                    Number(invoice.totalAmount) - Number(invoice.paidAmount)
                  ).toLocaleString('ru-RU')}{' '}
                  {invoice.currency} остаток
                </option>
              ))}
            </select>
            {selectedInvoice && (
              <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  Сумма счёта: {Number(selectedInvoice.totalAmount).toLocaleString('ru-RU')}{' '}
                  {selectedInvoice.currency}
                </p>
                <p className="text-sm text-gray-600">
                  Оплачено: {Number(selectedInvoice.paidAmount).toLocaleString('ru-RU')}{' '}
                  {selectedInvoice.currency}
                </p>
                <p className="text-sm font-medium">
                  Остаток:{' '}
                  {(
                    Number(selectedInvoice.totalAmount) - Number(selectedInvoice.paidAmount)
                  ).toLocaleString('ru-RU')}{' '}
                  {selectedInvoice.currency}
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Сумма *
              </label>
              <input
                type="number"
                step="0.01"
                {...register('amount', { valueAsNumber: true })}
                className="input"
                placeholder="0.00"
              />
              {errors.amount && (
                <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
              )}
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Способ оплаты *
              </label>
              <select {...register('paymentMethod')} className="input">
                <option value="CASH">Наличные</option>
                <option value="BANK_TRANSFER">Банковский перевод</option>
                <option value="CARD">Карта</option>
                <option value="ELECTRONIC">Электронный платёж</option>
                <option value="OTHER">Другое</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Дата платежа *
              </label>
              <input
                type="date"
                {...register('paymentDate')}
                className="input"
              />
              {errors.paymentDate && (
                <p className="mt-1 text-sm text-red-600">{errors.paymentDate.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Номер платёжного документа
            </label>
            <input
              {...register('reference')}
              className="input"
              placeholder="ПП-123456"
            />
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

