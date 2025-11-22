import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productService } from '../services/productService';
import { Link } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';

const productSchema = z.object({
  name: z.string().min(1, 'Название обязательно'),
  sku: z.string().optional(),
  description: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  unit: z.string().default('шт'),
  price: z.number().min(0, 'Цена должна быть положительной'),
  currency: z.string().default('RUB'),
  taxRate: z.number().min(0).max(100).default(20),
  isService: z.boolean().default(false),
});

type ProductFormData = z.infer<typeof productSchema>;

export default function ProductFormPage() {
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
    watch,
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      unit: 'шт',
      price: 0,
      currency: 'RUB',
      taxRate: 20,
      isService: false,
    },
  });

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: () => productService.getOne(id!),
    enabled: isEdit,
  });

  useEffect(() => {
    if (product?.data) {
      setValue('name', product.data.name);
      setValue('sku', product.data.sku || '');
      setValue('description', product.data.description || '');
      setValue('categoryId', product.data.categoryId || '');
      setValue('unit', product.data.unit);
      setValue('price', Number(product.data.price));
      setValue('currency', product.data.currency);
      setValue('taxRate', Number(product.data.taxRate));
      setValue('isService', product.data.isService);
    }
  }, [product, setValue]);

  const mutation = useMutation({
    mutationFn: (data: ProductFormData) =>
      isEdit ? productService.update(id!, data) : productService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      success(isEdit ? 'Товар обновлён' : 'Товар создан');
      navigate('/products');
    },
  });

  const onSubmit = (data: ProductFormData) => {
    mutation.mutate(data);
  };

  if (isEdit && isLoading) {
    return <div className="text-center py-8">Загрузка...</div>;
  }

  return (
    <div>
      <Link
        to="/products"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Назад к товарам
      </Link>

      <h1 className="text-3xl font-bold mb-6">
        {isEdit ? 'Редактировать товар' : 'Создать товар'}
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
              placeholder="Название товара"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Артикул (SKU)
            </label>
            <input
              {...register('sku')}
              className="input"
              placeholder="SKU-001"
            />
            {errors.sku && (
              <p className="mt-1 text-sm text-red-600">{errors.sku.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Описание
            </label>
            <textarea
              {...register('description')}
              className="input"
              rows={3}
              placeholder="Описание товара"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Единица измерения
              </label>
              <select {...register('unit')} className="input">
                <option value="шт">шт</option>
                <option value="кг">кг</option>
                <option value="л">л</option>
                <option value="м">м</option>
                <option value="м²">м²</option>
                <option value="м³">м³</option>
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Цена *
              </label>
              <input
                type="number"
                step="0.01"
                {...register('price', { valueAsNumber: true })}
                className="input"
                placeholder="0.00"
              />
              {errors.price && (
                <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                НДС (%)
              </label>
              <input
                type="number"
                step="0.01"
                {...register('taxRate', { valueAsNumber: true })}
                className="input"
                placeholder="20"
              />
              {errors.taxRate && (
                <p className="mt-1 text-sm text-red-600">{errors.taxRate.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                {...register('isService')}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium text-gray-700">Это услуга</span>
            </label>
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
            <Link to="/products" className="btn btn-secondary">
              Отмена
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}

