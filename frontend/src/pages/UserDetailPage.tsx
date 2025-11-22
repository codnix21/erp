import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '../services/userService';
import { ArrowLeft, Edit, Trash2, Mail, User as UserIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePermissions } from '../hooks/usePermissions';

const roleLabels: Record<string, string> = {
  Admin: 'Администратор',
  Manager: 'Менеджер',
  Accountant: 'Бухгалтер',
  Warehouse: 'Складской',
};

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();

  const { data, isLoading, error } = useQuery({
    queryKey: ['user', id],
    queryFn: () => userService.getOne(id!),
    enabled: !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await userService.delete(id!);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      navigate('/users');
    },
    onError: (error: any) => {
      alert(error.response?.data?.error?.message || 'Ошибка при удалении пользователя');
    },
  });

  if (isLoading) {
    return <div className="text-center py-8">Загрузка...</div>;
  }

  if (error || !data?.data) {
    return (
      <div className="text-center py-8 text-red-600">
        Ошибка загрузки пользователя или пользователь не найден
      </div>
    );
  }

  const user = data.data;

  const handleDelete = () => {
    if (confirm(`Вы уверены, что хотите удалить пользователя "${user.email}"?`)) {
      deleteMutation.mutate();
    }
  };

  return (
    <div>
      <Link
        to="/users"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Назад к пользователям
      </Link>

      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
            <UserIcon className="w-8 h-8 text-primary-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">
              {user.firstName || user.lastName
                ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                : user.email}
            </h1>
            <p className="text-gray-600 mt-1">{user.email}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {hasPermission('users:update') && (
            <Link to={`/users/${id}/edit`} className="btn btn-primary flex items-center gap-2">
              <Edit className="w-4 h-4" />
              Редактировать
            </Link>
          )}
          {hasPermission('users:delete') && (
            <button
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="btn btn-danger flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              {deleteMutation.isPending ? 'Удаление...' : 'Удалить'}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Основная информация</h2>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-500">Email</label>
              <div className="flex items-center gap-2 mt-1">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="font-medium">{user.email}</span>
              </div>
            </div>
            {user.firstName && (
              <div>
                <label className="text-sm text-gray-500">Имя</label>
                <p className="font-medium mt-1">{user.firstName}</p>
              </div>
            )}
            {user.lastName && (
              <div>
                <label className="text-sm text-gray-500">Фамилия</label>
                <p className="font-medium mt-1">{user.lastName}</p>
              </div>
            )}
            <div>
              <label className="text-sm text-gray-500">Статус</label>
              <div className="mt-1">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    user.isActive
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {user.isActive ? 'Активен' : 'Неактивен'}
                </span>
              </div>
            </div>
            <div>
              <label className="text-sm text-gray-500">Дата создания</label>
              <p className="font-medium mt-1">
                {new Date(user.createdAt).toLocaleDateString('ru-RU', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Роли и компании</h2>
          {user.userCompanyRoles && user.userCompanyRoles.length > 0 ? (
            <div className="space-y-3">
              {user.userCompanyRoles.map((ucr) => (
                <div
                  key={ucr.id}
                  className={`p-3 rounded-lg border ${
                    ucr.isActive ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{roleLabels[ucr.role.name] || ucr.role.name}</p>
                      <p className="text-sm text-gray-600">{ucr.company.name}</p>
                    </div>
                    {!ucr.isActive && (
                      <span className="text-xs text-red-600">(неактивна)</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">Роли не назначены</p>
          )}
        </div>
      </div>
    </div>
  );
}

