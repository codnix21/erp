import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customerService } from '../services/customerService';
import { Link } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';

const customerSchema = z.object({
  name: z.string().min(1, 'Название обязательно'),
  email: z.string().email('Неверный email').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  taxId: z.string().optional(),
  notes: z.string().optional(),
});

type CustomerFormData = z.infer<typeof customerSchema>;

export default function CustomerFormPage() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { success } = useNotifications();
  const isEdit = !!id;

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
  });

  const { data: customer, isLoading } = useQuery({
    queryKey: ['customer', id],
    queryFn: () => customerService.getOne(id!),
    enabled: isEdit,
  });

  useEffect(() => {
    if (customer?.data) {
      setValue('name', customer.data.name);
      setValue('email', customer.data.email || '');
      setValue('phone', customer.data.phone || '');
      setValue('address', customer.data.address || '');
      setValue('taxId', customer.data.taxId || '');
      setValue('notes', (customer.data as any).notes || '');
    }
  }, [customer, setValue]);

  const mutation = useMutation({
    mutationFn: (data: CustomerFormData) =>
      isEdit ? customerService.update(id!, data) : customerService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      success(isEdit ? 'Клиент обновлён' : 'Клиент создан');
      navigate('/customers');
    },
  });

  const onSubmit = (data: CustomerFormData) => {
    const submitData = {
      ...data,
      email: data.email || undefined,
    };
    mutation.mutate(submitData);
  };

  if (isEdit && isLoading) {
    return <div className="text-center py-8">Загрузка...</div>;
  }

  return (
    <div>
      <Link
        to="/customers"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Назад к клиентам
      </Link>

      <h1 className="text-3xl font-bold mb-6">
        {isEdit ? 'Редактировать клиента' : 'Создать клиента'}
      </h1>

      <form onSubmit={handleSubmit(onSubmit)} className="card max-w-2xl">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Название / Имя *
            </label>
            <input
              {...register('name')}
              className="input"
              placeholder="ООО Клиент или Имя Фамилия"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                {...register('email')}
                className="input"
                placeholder="client@example.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Телефон
              </label>
              <input
                {...register('phone')}
                className="input"
                placeholder="+7 999 123 45 67"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Адрес
            </label>
            <input
              {...register('address')}
              className="input"
              placeholder="г. Москва, ул. Примерная, д. 1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ИНН
            </label>
            <input
              {...register('taxId')}
              className="input"
              placeholder="1234567890"
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
            <Link to="/customers" className="btn btn-secondary">
              Отмена
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}

