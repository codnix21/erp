import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supplierService } from '../services/supplierService';
import { ArrowLeft, Edit } from 'lucide-react';
import { usePermissions } from '../hooks/usePermissions';

export default function SupplierDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { hasPermission } = usePermissions();

  const { data, isLoading, error } = useQuery({
    queryKey: ['supplier', id],
    queryFn: () => supplierService.getOne(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return <div className="text-center py-8">Загрузка...</div>;
  }

  if (error || !data?.data) {
    return (
      <div className="text-center py-8 text-red-600">
        Ошибка загрузки поставщика или поставщик не найден
      </div>
    );
  }

  const supplier = data.data;

  return (
    <div>
      <Link
        to="/suppliers"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Назад к поставщикам
      </Link>

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">{supplier.name}</h1>
          <p className="text-gray-600 mt-1">
            Создан {new Date(supplier.createdAt).toLocaleString('ru-RU')}
          </p>
        </div>
        <div className="flex gap-2">
          {hasPermission('suppliers:update') && (
            <Link
              to={`/suppliers/${supplier.id}/edit`}
              className="btn btn-secondary flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Редактировать
            </Link>
          )}
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              supplier.isActive
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {supplier.isActive ? 'Активен' : 'Неактивен'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Контактная информация</h2>
          <div className="space-y-3">
            {supplier.email && (
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium">{supplier.email}</p>
              </div>
            )}
            {supplier.phone && (
              <div>
                <p className="text-sm text-gray-600">Телефон</p>
                <p className="font-medium">{supplier.phone}</p>
              </div>
            )}
            {supplier.address && (
              <div>
                <p className="text-sm text-gray-600">Адрес</p>
                <p className="font-medium">{supplier.address}</p>
              </div>
            )}
            {supplier.taxId && (
              <div>
                <p className="text-sm text-gray-600">ИНН</p>
                <p className="font-medium">{supplier.taxId}</p>
              </div>
            )}
          </div>
        </div>

        {supplier.notes && (
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Примечания</h2>
            <p className="text-gray-700">{supplier.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}

