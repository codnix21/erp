import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { warehouseService } from '../services/warehouseService';
import { productService } from '../services/productService';
import { Link } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';

const stockMovementSchema = z.object({
  warehouseId: z.string().uuid('Выберите склад'),
  productId: z.string().uuid('Выберите товар'),
  movementType: z.string(),
  quantity: z.number().positive('Количество должно быть больше 0'),
  referenceId: z.string().uuid().optional(),
  referenceType: z.string().optional(),
  notes: z.string().optional(),
});

type StockMovementFormData = z.infer<typeof stockMovementSchema>;

export default function StockMovementFormPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { success, error: showError } = useNotifications();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<StockMovementFormData>({
    resolver: zodResolver(stockMovementSchema),
    defaultValues: {
      movementType: 'IN',
    },
  });

  const { data: warehousesData } = useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => {
      const response = await api.get('/warehouses', { params: { limit: 100 } });
      return response.data;
    },
  });

  const { data: productsData } = useQuery({
    queryKey: ['products'],
    queryFn: () => productService.getAll({ page: 1, limit: 100, isService: false }),
  });

  const { data: ordersData } = useQuery({
    queryKey: ['orders', 'for-movement'],
    queryFn: async () => {
      const response = await api.get('/orders', { params: { page: 1, limit: 100 } });
      return response.data;
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: StockMovementFormData) => {
      const response = await api.post('/stock-movements', {
        ...data,
        referenceId: data.referenceId || undefined,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
      queryClient.invalidateQueries({ queryKey: ['stock'] });
      success('Движение товара создано');
      navigate('/stock');
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.error?.message || error?.message || 'Ошибка при создании движения товара';
      showError(errorMessage);
    },
  });

  const onSubmit = (data: StockMovementFormData) => {
    mutation.mutate(data);
  };

  const warehouses = warehousesData?.data || [];
  const products = productsData?.data || [];
  const orders = ordersData?.data || [];
  const movementType = watch('movementType');

  return (
    <div>
      <Link
        to="/stock"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Назад к остаткам
      </Link>

      <h1 className="text-3xl font-bold mb-6">Создать движение товара</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="card max-w-2xl">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Склад *
            </label>
            <select {...register('warehouseId')} className="input">
              <option value="">Выберите склад</option>
              {warehouses.map((warehouse: any) => (
                <option key={warehouse.id} value={warehouse.id}>
                  {warehouse.name}
                </option>
              ))}
            </select>
            {errors.warehouseId && (
              <p className="mt-1 text-sm text-red-600">{errors.warehouseId.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Товар *
            </label>
            <select {...register('productId')} className="input">
              <option value="">Выберите товар</option>
              {products.map((product: any) => (
                <option key={product.id} value={product.id}>
                  {product.name} ({product.sku || 'без артикула'})
                </option>
              ))}
            </select>
            {errors.productId && (
              <p className="mt-1 text-sm text-red-600">{errors.productId.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Тип движения *
            </label>
            <select {...register('movementType')} className="input">
              <option value="IN">Приход</option>
              <option value="OUT">Расход</option>
              <option value="ADJUSTMENT">Корректировка</option>
              <option value="RESERVED">Резервирование</option>
              <option value="UNRESERVED">Снятие резерва</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Количество *
            </label>
            <input
              type="number"
              step="0.01"
              {...register('quantity', { valueAsNumber: true })}
              className="input"
              placeholder="1.00"
            />
            {errors.quantity && (
              <p className="mt-1 text-sm text-red-600">{errors.quantity.message}</p>
            )}
          </div>

          {(movementType === 'IN' || movementType === 'OUT') && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Связанный заказ (опционально)
                </label>
                <select {...register('referenceId')} className="input">
                  <option value="">Без заказа</option>
                  {orders.map((order: any) => (
                    <option key={order.id} value={order.id}>
                      {order.orderNumber} - {order.customer?.name || order.supplier?.name}
                    </option>
                  ))}
                </select>
                {watch('referenceId') && (
                  <input
                    type="hidden"
                    {...register('referenceType')}
                    value="ORDER"
                  />
                )}
              </div>
            </>
          )}

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
              {mutation.isPending ? 'Сохранение...' : 'Создать движение'}
            </button>
            <Link to="/stock" className="btn btn-secondary">
              Отмена
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}

