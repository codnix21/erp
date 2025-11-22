import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { warehouseService } from '../services/warehouseService';
import { Link } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';

const warehouseSchema = z.object({
  name: z.string().min(1, 'Название обязательно'),
  address: z.string().optional(),
  isActive: z.boolean().default(true),
});

type WarehouseFormData = z.infer<typeof warehouseSchema>;

export default function WarehouseFormPage() {
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
  } = useForm<WarehouseFormData>({
    resolver: zodResolver(warehouseSchema),
    defaultValues: {
      isActive: true,
    },
  });

  const { data: warehouse, isLoading } = useQuery({
    queryKey: ['warehouse', id],
    queryFn: () => warehouseService.getOne(id!),
    enabled: isEdit,
  });

  useEffect(() => {
    if (warehouse?.data) {
      setValue('name', warehouse.data.name);
      setValue('address', warehouse.data.address || '');
      setValue('isActive', warehouse.data.isActive);
    }
  }, [warehouse, setValue]);

  const mutation = useMutation({
    mutationFn: (data: WarehouseFormData) =>
      isEdit ? warehouseService.update(id!, data) : warehouseService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      queryClient.invalidateQueries({ queryKey: ['warehouse', id] });
      success(isEdit ? 'Склад обновлён' : 'Склад создан');
      navigate('/warehouses');
    },
  });

  const onSubmit = (data: WarehouseFormData) => {
    mutation.mutate(data);
  };

  if (isEdit && isLoading) {
    return <div className="text-center py-8">Загрузка...</div>;
  }

  return (
    <div>
      <Link
        to="/warehouses"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Назад к складам
      </Link>

      <h1 className="text-3xl font-bold mb-6">
        {isEdit ? 'Редактировать склад' : 'Создать склад'}
      </h1>

      <form onSubmit={handleSubmit(onSubmit)} className="card max-w-2xl">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Название *
            </label>
            <input
              {...register('name')}
              className="input"
              placeholder="Название склада"
            />
            {errors.name && (
              <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Адрес
            </label>
            <textarea
              {...register('address')}
              className="input"
              rows={3}
              placeholder="Адрес склада"
            />
            {errors.address && (
              <p className="text-red-600 text-sm mt-1">{errors.address.message}</p>
            )}
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
            <Link to="/warehouses" className="btn btn-secondary">
              Отмена
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}

