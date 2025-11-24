import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderService } from '../services/orderService';
import { customerService } from '../services/customerService';
import { productService } from '../services/productService';
import { Link } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';

const orderItemSchema = z.object({
  productId: z.string().uuid('Выберите товар'),
  quantity: z.number().positive('Количество должно быть больше 0'),
  price: z.number().min(0, 'Цена должна быть положительной'),
  taxRate: z.number().min(0).max(100).optional().default(20),
});

const orderSchema = z.object({
  customerId: z.string().uuid().optional(),
  supplierId: z.string().uuid().optional(),
  status: z.string().optional().default('DRAFT'),
  currency: z.string().optional().default('RUB'),
  notes: z.string().optional(),
  dueDate: z.string().optional(),
  items: z.array(orderItemSchema).min(1, 'Добавьте хотя бы один товар'),
});

type OrderFormData = z.infer<typeof orderSchema>;

export default function OrderFormPage() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { success, error: showError } = useNotifications();
  const isEdit = !!id;

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    setValue,
    watch,
  } = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema) as any,
    defaultValues: {
      status: 'DRAFT',
      currency: 'RUB',
      items: [{ productId: '', quantity: 1, price: 0, taxRate: 20 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => orderService.getOne(id!),
    enabled: isEdit,
  });

  const { data: customersData } = useQuery({
    queryKey: ['customers'],
    queryFn: () => customerService.getAll({ page: 1, limit: 100 }),
  });

  const { data: productsData } = useQuery({
    queryKey: ['products'],
    queryFn: () => productService.getAll({ page: 1, limit: 100 }),
  });

  useEffect(() => {
    if (order?.data) {
      setValue('customerId', order.data.customerId || '');
      setValue('supplierId', order.data.supplierId || '');
      setValue('status', order.data.status);
      setValue('currency', order.data.currency);
      setValue('notes', order.data.notes || '');
      setValue('dueDate', order.data.dueDate ? order.data.dueDate.split('T')[0] : '');
      if (order.data.items) {
        setValue(
          'items',
          order.data.items.map((item: any) => ({
            productId: item.productId,
            quantity: Number(item.quantity),
            price: Number(item.price),
            taxRate: Number(item.taxRate),
          }))
        );
      }
    }
  }, [order, setValue]);

  const mutation = useMutation({
    mutationFn: (data: OrderFormData) => {
      const submitData = {
        ...data,
        dueDate: data.dueDate ? `${data.dueDate}T00:00:00Z` : undefined,
      };
      return isEdit ? orderService.update(id!, submitData) : orderService.create(submitData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      success(isEdit ? 'Заказ обновлён' : 'Заказ создан');
      navigate('/orders');
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.error?.message || error?.message || 'Ошибка при сохранении заказа';
      showError(errorMessage);
    },
  });

  const onSubmit = (data: OrderFormData) => {
    mutation.mutate(data);
  };

  const customers = customersData?.data || [];
  const products = productsData?.data || [];

  const calculateItemTotal = (index: number) => {
    const item = watch(`items.${index}`);
    if (!item) return 0;
    const subtotal = item.quantity * item.price;
    const tax = subtotal * (item.taxRate / 100);
    return subtotal + tax;
  };

  const calculateTotal = () => {
    return fields.reduce((sum, _, index) => sum + calculateItemTotal(index), 0);
  };

  if (isEdit && isLoading) {
    return <div className="text-center py-8">Загрузка...</div>;
  }

  return (
    <div>
      <Link
        to="/orders"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Назад к заказам
      </Link>

      <h1 className="text-3xl font-bold mb-6">
        {isEdit ? 'Редактировать заказ' : 'Создать заказ'}
      </h1>

      <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Основная информация</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Клиент
                </label>
                <select {...register('customerId')} className="input">
                  <option value="">Выберите клиента</option>
                  {customers.map((customer: any) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Статус
                  </label>
                  <select {...register('status')} className="input">
                    <option value="DRAFT">Черновик</option>
                    <option value="PENDING">Ожидает</option>
                    <option value="CONFIRMED">Подтверждён</option>
                    <option value="IN_PROGRESS">В работе</option>
                    <option value="COMPLETED">Завершён</option>
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
                  Срок выполнения
                </label>
                <input
                  type="date"
                  {...register('dueDate')}
                  className="input"
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
            </div>
          </div>

          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Итого</h2>
            <div className="space-y-2">
              {fields.map((field, index) => (
                <div key={field.id} className="text-sm text-gray-600">
                  Позиция {index + 1}: {calculateItemTotal(index).toLocaleString('ru-RU')} ₽
                </div>
              ))}
              <div className="pt-4 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Итого:</span>
                  <span className="text-2xl font-bold text-primary-600">
                    {calculateTotal().toLocaleString('ru-RU')} {watch('currency')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Позиции заказа</h2>
            <button
              type="button"
              onClick={() => append({ productId: '', quantity: 1, price: 0, taxRate: 20 })}
              className="btn btn-secondary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Добавить позицию
            </button>
          </div>

          <div className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-medium">Позиция {index + 1}</h3>
                  {fields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Товар *
                    </label>
                    <select
                      {...register(`items.${index}.productId`)}
                      className="input"
                    >
                      <option value="">Выберите товар</option>
                      {products.map((product: any) => (
                        <option key={product.id} value={product.id}>
                          {product.name} ({product.sku || 'без артикула'})
                        </option>
                      ))}
                    </select>
                    {errors.items?.[index]?.productId && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.items[index]?.productId?.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Количество *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                      className="input"
                      placeholder="1"
                    />
                    {errors.items?.[index]?.quantity && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.items[index]?.quantity?.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Цена *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      {...register(`items.${index}.price`, { valueAsNumber: true })}
                      className="input"
                      placeholder="0.00"
                    />
                    {errors.items?.[index]?.price && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.items[index]?.price?.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    НДС (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    {...register(`items.${index}.taxRate`, { valueAsNumber: true })}
                    className="input w-32"
                    placeholder="20"
                  />
                </div>

                <div className="mt-2 text-right">
                  <span className="text-sm text-gray-600">Итого: </span>
                  <span className="font-medium">
                    {calculateItemTotal(index).toLocaleString('ru-RU')} {watch('currency')}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {errors.items && (
            <p className="mt-2 text-sm text-red-600">{errors.items.message}</p>
          )}
        </div>

        {mutation.isError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            Ошибка: {(mutation.error as any)?.response?.data?.error?.message || 'Неизвестная ошибка'}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={mutation.isPending}
            className="btn btn-primary flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {mutation.isPending ? 'Сохранение...' : 'Сохранить заказ'}
          </button>
          <Link to="/orders" className="btn btn-secondary">
            Отмена
          </Link>
        </div>
      </form>
    </div>
  );
}

