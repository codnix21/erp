import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { customerService } from '../services/customerService';
import { ArrowLeft, Edit, Trash2, Mail, Phone, MapPin, FileText } from 'lucide-react';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { usePermissions } from '../hooks/usePermissions';

const statusLabels: Record<string, string> = {
  DRAFT: 'Черновик',
  PENDING: 'Ожидает',
  CONFIRMED: 'Подтверждён',
  IN_PROGRESS: 'В работе',
  COMPLETED: 'Завершён',
  CANCELLED: 'Отменён',
};

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['customer', id],
    queryFn: () => customerService.getOne(id!),
    enabled: !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: () => customerService.delete(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      navigate('/customers');
    },
  });

  if (isLoading) {
    return <div className="text-center py-8">Загрузка...</div>;
  }

  if (error || !data?.data) {
    return (
      <div className="text-center py-8 text-red-600">
        Ошибка загрузки клиента или клиент не найден
      </div>
    );
  }

  const customer = data.data;

  const handleDelete = () => {
    if (showDeleteConfirm) {
      deleteMutation.mutate();
    } else {
      setShowDeleteConfirm(true);
    }
  };

  return (
    <div>
      <Link
        to="/customers"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Назад к клиентам
      </Link>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{customer.name}</h1>
        <div className="flex gap-2">
          {hasPermission('customers:update') && (
            <Link
              to={`/customers/${id}/edit`}
              className="btn btn-secondary flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Редактировать
            </Link>
          )}
          {hasPermission('customers:delete') && (
            <button
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="btn btn-danger flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              {showDeleteConfirm ? 'Подтвердить удаление' : 'Удалить'}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="card mb-6">
            <h2 className="text-xl font-semibold mb-4">Контактная информация</h2>
            <div className="space-y-3">
              {customer.email && (
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium">{customer.email}</p>
                  </div>
                </div>
              )}
              {customer.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Телефон</p>
                    <p className="font-medium">{customer.phone}</p>
                  </div>
                </div>
              )}
              {customer.address && (
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Адрес</p>
                    <p className="font-medium">{customer.address}</p>
                  </div>
                </div>
              )}
              {customer.taxId && (
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">ИНН</p>
                    <p className="font-medium">{customer.taxId}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {(customer as any).orders && (customer as any).orders.length > 0 && (
            <div className="card">
              <h2 className="text-xl font-semibold mb-4">Последние заказы</h2>
              <div className="space-y-2">
                {(customer as any).orders.map((order: any) => (
                  <Link
                    key={order.id}
                    to={`/orders/${order.id}`}
                    className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <div>
                      <p className="font-medium">{order.orderNumber}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(order.createdAt).toLocaleDateString('ru-RU')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {Number(order.totalAmount).toLocaleString('ru-RU')} {order.currency}
                      </p>
                      <p className="text-sm text-gray-600">{statusLabels[order.status] || (order.status ? 'Неизвестный статус' : 'Без статуса')}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        <div>
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Статистика</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Всего заказов</p>
                <p className="text-2xl font-bold text-primary-600">
                  {(customer as any).orders?.length || 0}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

