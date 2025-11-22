import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService, CreateUserInput, UpdateUserInput } from '../services/userService';
import { Link } from 'react-router-dom';
import { ArrowLeft, Save, Plus, X } from 'lucide-react';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import { usePermissions } from '../hooks/usePermissions';

const roleLabels: Record<string, string> = {
  Admin: 'Администратор',
  Manager: 'Менеджер',
  Accountant: 'Бухгалтер',
  Warehouse: 'Складской',
};

const userSchema = z.object({
  email: z.string().email('Неверный email'),
  password: z.string().min(6, 'Пароль должен быть не менее 6 символов').optional().or(z.literal('')),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  companyId: z.string().uuid('Выберите компанию'),
  roleId: z.string().uuid('Выберите роль'),
  isActive: z.boolean().default(true),
});

type UserFormData = z.infer<typeof userSchema>;

export default function UserFormPage() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuthStore();
  const { hasPermission } = usePermissions();
  const isEdit = !!id;
  const [newRoleCompanyId, setNewRoleCompanyId] = useState('');
  const [newRoleId, setNewRoleId] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      isActive: true,
    },
  });

  // Получение компаний и ролей
  const { data: companiesData } = useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      const response = await api.get('/companies');
      return response.data;
    },
  });

  const { data: rolesData } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const response = await api.get('/roles');
      return response.data;
    },
  });

  const { data: userData, isLoading } = useQuery({
    queryKey: ['user', id],
    queryFn: () => userService.getOne(id!),
    enabled: isEdit,
  });

  useEffect(() => {
    if (userData?.data) {
      const user = userData.data;
      setValue('email', user.email);
      setValue('firstName', user.firstName || '');
      setValue('lastName', user.lastName || '');
      setValue('isActive', user.isActive);
      // Для редактирования не требуем пароль и выбор компании/роли
      if (isEdit) {
        setValue('password', '');
        if (user.userCompanyRoles && user.userCompanyRoles.length > 0) {
          const firstRole = user.userCompanyRoles[0];
          setValue('companyId', firstRole.companyId);
          setValue('roleId', firstRole.roleId);
        }
      }
    }
  }, [userData, setValue, isEdit]);

  const mutation = useMutation({
    mutationFn: (data: UserFormData) => {
      if (isEdit) {
        const updateData: UpdateUserInput = {
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          isActive: data.isActive,
        };
        return userService.update(id!, updateData);
      } else {
        const createData: CreateUserInput = {
          email: data.email,
          password: data.password!,
          firstName: data.firstName,
          lastName: data.lastName,
          companyId: data.companyId,
          roleId: data.roleId,
        };
        return userService.create(createData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      alert(isEdit ? 'Пользователь обновлён' : 'Пользователь создан');
      navigate('/users');
    },
  });

  const assignRoleMutation = useMutation({
    mutationFn: async () => {
      if (!newRoleCompanyId || !newRoleId) {
        throw new Error('Выберите компанию и роль');
      }
      await userService.assignRole(id!, { companyId: newRoleCompanyId, roleId: newRoleId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', id] });
      setNewRoleCompanyId('');
      setNewRoleId('');
      alert('Роль назначена');
    },
    onError: (error: any) => {
      alert(error.response?.data?.error?.message || 'Ошибка при назначении роли');
    },
  });

  const removeRoleMutation = useMutation({
    mutationFn: async (roleId: string) => {
      await userService.removeRole(id!, roleId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', id] });
      alert('Роль удалена');
    },
    onError: (error: any) => {
      alert(error.response?.data?.error?.message || 'Ошибка при удалении роли');
    },
  });

  const onSubmit = (data: UserFormData) => {
    mutation.mutate(data);
  };

  const handleAssignRole = () => {
    assignRoleMutation.mutate();
  };

  const handleRemoveRole = (roleId: string) => {
    if (confirm('Вы уверены, что хотите удалить эту роль?')) {
      removeRoleMutation.mutate(roleId);
    }
  };

  if (isEdit && isLoading) {
    return <div className="text-center py-8">Загрузка...</div>;
  }

  const companies = companiesData?.data || [];
  const roles = rolesData?.data || [];

  return (
    <div>
      <Link
        to="/users"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Назад к пользователям
      </Link>

      <h1 className="text-3xl font-bold mb-6">
        {isEdit ? 'Редактировать пользователя' : 'Создать пользователя'}
      </h1>

      <form onSubmit={handleSubmit(onSubmit)} className="card max-w-2xl">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input {...register('email')} className="input" type="email" />
            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
          </div>

          {!isEdit && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Пароль *</label>
              <input {...register('password')} className="input" type="password" />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Имя</label>
              <input {...register('firstName')} className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Фамилия</label>
              <input {...register('lastName')} className="input" />
            </div>
          </div>

          {!isEdit && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Компания *
                </label>
                <select {...register('companyId')} className="input">
                  <option value="">Выберите компанию</option>
                  {companies.map((company: any) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
                {errors.companyId && (
                  <p className="mt-1 text-sm text-red-600">{errors.companyId.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Роль *</label>
                <select {...register('roleId')} className="input">
                  <option value="">Выберите роль</option>
                  {roles.map((role: any) => (
                    <option key={role.id} value={role.id}>
                      {role.name} - {role.description || ''}
                    </option>
                  ))}
                </select>
                {errors.roleId && (
                  <p className="mt-1 text-sm text-red-600">{errors.roleId.message}</p>
                )}
              </div>
            </>
          )}

          {isEdit && (
            <>
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    {...register('isActive')}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm font-medium text-gray-700">Активен</span>
                </label>
              </div>

              {userData?.data && (
                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold mb-3">Роли пользователя</h3>
                  {userData.data.userCompanyRoles && userData.data.userCompanyRoles.length > 0 ? (
                    <div className="space-y-2 mb-4">
                      {userData.data.userCompanyRoles.map((ucr) => (
                        <div
                          key={ucr.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div>
                            <span className="font-medium">{roleLabels[ucr.role.name] || ucr.role.name}</span>
                            <span className="text-gray-500 ml-2">({ucr.company.name})</span>
                            {!ucr.isActive && (
                              <span className="ml-2 text-xs text-red-600">(неактивна)</span>
                            )}
                          </div>
                          {hasPermission('users:update') && ucr.isActive && (
                            <button
                              type="button"
                              onClick={() => handleRemoveRole(ucr.id)}
                              className="text-red-600 hover:text-red-800"
                              disabled={removeRoleMutation.isPending}
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 mb-4">Роли не назначены</p>
                  )}

                  {hasPermission('users:update') && (
                    <div className="border-t pt-4">
                      <h4 className="text-sm font-medium mb-2">Назначить новую роль</h4>
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <select
                          value={newRoleCompanyId}
                          onChange={(e) => setNewRoleCompanyId(e.target.value)}
                          className="input"
                        >
                          <option value="">Выберите компанию</option>
                          {companies.map((company: any) => (
                            <option key={company.id} value={company.id}>
                              {company.name}
                            </option>
                          ))}
                        </select>
                        <select
                          value={newRoleId}
                          onChange={(e) => setNewRoleId(e.target.value)}
                          className="input"
                        >
                          <option value="">Выберите роль</option>
                          {roles.map((role: any) => (
                            <option key={role.id} value={role.id}>
                              {role.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <button
                        type="button"
                        onClick={handleAssignRole}
                        disabled={!newRoleCompanyId || !newRoleId || assignRoleMutation.isPending}
                        className="btn btn-secondary flex items-center gap-2 text-sm"
                      >
                        <Plus className="w-4 h-4" />
                        {assignRoleMutation.isPending ? 'Назначение...' : 'Назначить роль'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

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
            <Link to="/users" className="btn btn-secondary">
              Отмена
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}

