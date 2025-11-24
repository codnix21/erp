import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supplierService } from '../services/supplierService';
import { Link } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';

const supplierSchema = z.object({
  name: z.string().min(1, 'Название обязательно'),
  email: z.string().email('Неверный email').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  taxId: z.string().optional(),
  notes: z.string().optional(),
  isActive: z.boolean().optional().default(true),
});

type SupplierFormData = z.infer<typeof supplierSchema>;

export default function SupplierFormPage() {
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
  } = useForm<SupplierFormData>({
    resolver: zodResolver(supplierSchema) as any,
    defaultValues: {
      isActive: true,
    },
  });

  const { data: supplier, isLoading } = useQuery({
    queryKey: ['supplier', id],
    queryFn: () => supplierService.getOne(id!),
    enabled: isEdit,
  });

  useEffect(() => {
    if (supplier?.data) {
      setValue('name', supplier.data.name);
      setValue('email', supplier.data.email || '');
      setValue('phone', supplier.data.phone || '');
      setValue('address', supplier.data.address || '');
      setValue('taxId', supplier.data.taxId || '');
      setValue('notes', supplier.data.notes || '');
      setValue('isActive', supplier.data.isActive);
    }
  }, [supplier, setValue]);

  const mutation = useMutation({
    mutationFn: (data: SupplierFormData) => {
      const submitData = {
        ...data,
        email: data.email || undefined,
      };
      return isEdit ? supplierService.update(id!, submitData) : supplierService.create(submitData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      success(isEdit ? 'Поставщик обновлён' : 'Поставщик создан');
      navigate('/suppliers');
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.error?.message || error?.message || 'Ошибка при сохранении поставщика';
      showError(errorMessage);
    },
  });

  const onSubmit = (data: SupplierFormData) => {
    mutation.mutate(data);
  };

  if (isEdit && isLoading) {
    return <div className="text-center py-8">Загрузка...</div>;
  }

  return (
    <div>
      <Link
        to="/suppliers"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Назад к поставщикам
      </Link>

      <h1 className="text-3xl font-bold mb-6">
        {isEdit ? 'Редактировать поставщика' : 'Создать поставщика'}
      </h1>

      <form onSubmit={handleSubmit(onSubmit as any)} className="card max-w-2xl">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Название / Имя *
            </label>
            <input
              {...register('name')}
              className="input"
              placeholder="Название компании или ФИО"
            />
            {errors.name && (
              <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              {...register('email')}
              type="email"
              className="input"
              placeholder="email@example.com"
            />
            {errors.email && (
              <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Телефон
            </label>
            <input
              {...register('phone')}
              className="input"
              placeholder="+7 (999) 123-45-67"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Адрес
            </label>
            <textarea
              {...register('address')}
              className="input"
              rows={3}
              placeholder="Полный адрес"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ИНН
            </label>
            <input
              {...register('taxId')}
              className="input"
              placeholder="ИНН"
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

          {isEdit && (
            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  {...register('isActive')}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium text-gray-700">Активен</span>
              </label>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button type="submit" className="btn btn-primary flex items-center gap-2" disabled={mutation.isPending}>
              <Save className="w-4 h-4" />
              {mutation.isPending ? 'Сохранение...' : 'Сохранить'}
            </button>
            <Link to="/suppliers" className="btn btn-secondary">
              Отмена
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}

