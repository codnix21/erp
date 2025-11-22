import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supplierService } from '../services/supplierService';
import { Plus, Search, Truck } from 'lucide-react';
import { usePermissions } from '../hooks/usePermissions';

export default function SuppliersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const { hasPermission } = usePermissions();

  const { data, isLoading, error } = useQuery({
    queryKey: ['suppliers', page, search],
    queryFn: () => supplierService.getAll({ page, limit: 20, search: search || undefined }),
  });

  if (isLoading) return <div className="text-center py-8">Загрузка...</div>;
  if (error) return <div className="text-center py-8 text-red-600">Ошибка загрузки поставщиков</div>;

  const suppliers = data?.data || [];
  const meta = data?.meta;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Truck className="w-8 h-8" />
          Поставщики
        </h1>
        {hasPermission('suppliers:create') && (
          <Link to="/suppliers/new" className="btn btn-primary flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Добавить поставщика
          </Link>
        )}
      </div>

      <div className="card mb-6">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Поиск по названию, email, телефону..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-10"
            />
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="table">
          <thead>
            <tr>
              <th>Название</th>
              <th>Email</th>
              <th>Телефон</th>
              <th>Адрес</th>
              <th>Статус</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {suppliers.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-gray-500">
                  Поставщики не найдены
                </td>
              </tr>
            ) : (
              suppliers.map((supplier) => (
                <tr key={supplier.id} className="hover:bg-gray-50">
                  <td className="font-medium">{supplier.name}</td>
                  <td>{supplier.email || '-'}</td>
                  <td>{supplier.phone || '-'}</td>
                  <td>{supplier.address || '-'}</td>
                  <td>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        supplier.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {supplier.isActive ? 'Активен' : 'Неактивен'}
                    </span>
                  </td>
                  <td>
                    <Link
                      to={`/suppliers/${supplier.id}`}
                      className="text-primary-600 hover:text-primary-700 font-medium mr-3"
                    >
                      Открыть
                    </Link>
                    {hasPermission('suppliers:update') && (
                      <Link
                        to={`/suppliers/${supplier.id}/edit`}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Редактировать
                      </Link>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {meta && meta.totalPages > 1 && (
          <div className="px-4 py-3 border-t flex justify-between items-center">
            <span className="text-sm text-gray-600">
              Страница {meta.page} из {meta.totalPages} (всего {meta.total})
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn btn-secondary text-sm disabled:opacity-50"
              >
                Назад
              </button>
              <button
                onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                disabled={page === meta.totalPages}
                className="btn btn-secondary text-sm disabled:opacity-50"
              >
                Вперёд
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

