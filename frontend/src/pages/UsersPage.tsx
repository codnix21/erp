import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { userService, User } from '../services/userService';
import { Plus, Search, User as UserIcon, Trash2 } from 'lucide-react';
import { usePermissions } from '../hooks/usePermissions';
import { useNotifications } from '../context/NotificationContext';
import { useAuthStore } from '../store/authStore';

const roleLabels: Record<string, string> = {
  Admin: 'Администратор',
  Manager: 'Менеджер',
  Accountant: 'Бухгалтер',
  Warehouse: 'Складской',
};

export default function UsersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const { hasPermission } = usePermissions();
  const queryClient = useQueryClient();
  const { success, error: showError } = useNotifications();
  const { isAuthenticated, accessToken } = useAuthStore();

  const { data, isLoading, error } = useQuery({
    queryKey: ['users', page, search],
    queryFn: () => userService.getAll({ page, limit: 20, search: search || undefined }),
    enabled: isAuthenticated && !!accessToken,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await userService.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      success('Пользователь удалён');
    },
    onError: (error: any) => {
      showError(error.response?.data?.error?.message || 'Ошибка при удалении пользователя');
    },
  });

  const handleDelete = (id: string, email: string) => {
    if (confirm(`Вы уверены, что хотите удалить пользователя "${email}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Загрузка...</div>;
  }

  if (error) {
    const errorMessage = (error as any)?.response?.data?.error?.message || (error as any)?.message || 'Ошибка загрузки пользователей';
    return (
      <div className="card text-center py-8">
        <div className="text-red-600 font-medium mb-2">Ошибка загрузки пользователей</div>
        <div className="text-sm text-gray-500">{errorMessage}</div>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 btn btn-secondary text-sm"
        >
          Обновить страницу
        </button>
      </div>
    );
  }

  const users = (data?.success ? data.data : data?.data) || [];
  const meta = data?.meta;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <UserIcon className="w-8 h-8" />
          Пользователи
        </h1>
        {hasPermission('users:create') && (
          <Link to="/users/new" className="btn btn-primary flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Добавить пользователя
          </Link>
        )}
      </div>

      <div className="card mb-6">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Поиск по email, имени..."
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
              <th>Email</th>
              <th>Имя</th>
              <th>Роли</th>
              <th>Статус</th>
              <th>Дата создания</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-gray-500">
                  Пользователи не найдены
                </td>
              </tr>
            ) : (
              users.map((user: User) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="font-medium">{user.email}</td>
                  <td>
                    {user.firstName || user.lastName
                      ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                      : '-'}
                  </td>
                  <td>
                    {user.userCompanyRoles && user.userCompanyRoles.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {user.userCompanyRoles
                          .filter((ucr) => ucr.isActive)
                          .map((ucr) => (
                            <span
                              key={ucr.id}
                              className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                            >
                              {roleLabels[ucr.role.name] || ucr.role.name} ({ucr.company.name})
                            </span>
                          ))}
                      </div>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {user.isActive ? 'Активен' : 'Неактивен'}
                    </span>
                  </td>
                  <td>{new Date(user.createdAt).toLocaleDateString('ru-RU')}</td>
                  <td>
                    <div className="flex gap-2">
                      <Link
                        to={`/users/${user.id}`}
                        className="text-primary-600 hover:text-primary-700 font-medium"
                      >
                        Открыть
                      </Link>
                      {hasPermission('users:update') && (
                        <Link
                          to={`/users/${user.id}/edit`}
                          className="text-gray-600 hover:text-gray-800 text-sm"
                        >
                          Редактировать
                        </Link>
                      )}
                      {hasPermission('users:delete') && (
                        <button
                          onClick={() => handleDelete(user.id, user.email)}
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

