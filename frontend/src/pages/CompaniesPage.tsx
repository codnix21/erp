import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, Search, Building2, Trash2 } from 'lucide-react';
import { usePermissions } from '../hooks/usePermissions';
import api from '../services/api';

interface Company {
  id: string;
  name: string;
  inn?: string;
  address?: string;
  phone?: string;
  email?: string;
  defaultCurrency: string;
  isActive: boolean;
  createdAt: string;
}

export default function CompaniesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const { hasPermission } = usePermissions();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['companies', page, search],
    queryFn: async () => {
      const response = await api.get('/companies', {
        params: { page, limit: 20, search: search || undefined },
      });
      return response.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/companies/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      alert('Компания удалена');
    },
    onError: (error: any) => {
      alert(error.response?.data?.error?.message || 'Ошибка при удалении компании');
    },
  });

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Вы уверены, что хотите удалить компанию "${name}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Загрузка...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-600">Ошибка загрузки компаний</div>;
  }

  const companies = data?.data || [];
  const meta = data?.meta;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Building2 className="w-8 h-8" />
          Компании
        </h1>
        {hasPermission('users:create') && (
          <Link to="/companies/new" className="btn btn-primary flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Добавить компанию
          </Link>
        )}
      </div>

      <div className="card mb-6">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Поиск по названию, ИНН, email..."
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
              <th>ИНН</th>
              <th>Email</th>
              <th>Телефон</th>
              <th>Валюта</th>
              <th>Статус</th>
              <th>Дата создания</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {companies.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-8 text-gray-500">
                  Компании не найдены
                </td>
              </tr>
            ) : (
              companies.map((company: Company) => (
                <tr key={company.id} className="hover:bg-gray-50">
                  <td className="font-medium">{company.name}</td>
                  <td>{company.inn || '-'}</td>
                  <td>{company.email || '-'}</td>
                  <td>{company.phone || '-'}</td>
                  <td>{company.defaultCurrency}</td>
                  <td>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        company.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {company.isActive ? 'Активна' : 'Неактивна'}
                    </span>
                  </td>
                  <td>{new Date(company.createdAt).toLocaleDateString('ru-RU')}</td>
                  <td>
                    <div className="flex gap-2">
                      <Link
                        to={`/companies/${company.id}`}
                        className="text-primary-600 hover:text-primary-700 font-medium"
                      >
                        Открыть
                      </Link>
                      {hasPermission('users:update') && (
                        <>
                          <Link
                            to={`/companies/${company.id}/edit`}
                            className="text-gray-600 hover:text-gray-800 text-sm"
                          >
                            Редактировать
                          </Link>
                        </>
                      )}
                      {hasPermission('users:delete') && (
                        <button
                          onClick={() => handleDelete(company.id, company.name)}
                          className="text-red-600 hover:text-red-800 text-sm flex items-center gap-1"
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                          Удалить
                        </button>
                      )}
                    </div>
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

