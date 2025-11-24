import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { categoryService } from '../services/categoryService';
import { Plus, Edit, Trash2, Eye, FolderTree } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { usePermissions } from '../hooks/usePermissions';
import { useAuthStore } from '../store/authStore';

export default function CategoriesPage() {
  const queryClient = useQueryClient();
  const { success, error: showError } = useNotifications();
  const { hasPermission } = usePermissions();
  const { isAuthenticated, accessToken } = useAuthStore();

  const { data, isLoading, error } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryService.getAll(),
    enabled: isAuthenticated && !!accessToken,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => categoryService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      success('Категория удалена');
    },
    onError: (err: any) => {
      showError(err.response?.data?.error?.message || 'Ошибка при удалении категории');
    },
  });

  const handleDelete = (id: string) => {
    if (window.confirm('Вы уверены, что хотите удалить эту категорию?')) {
      deleteMutation.mutate(id);
    }
  };

  const categories = data?.data || [];

  // Группируем категории по родительским
  const rootCategories = categories.filter((cat) => !cat.parentId);
  const childCategories = categories.filter((cat) => cat.parentId);

  const getChildren = (parentId: string) => {
    return childCategories.filter((cat) => cat.parentId === parentId);
  };

  if (isLoading) {
    return <div className="text-center py-8">Загрузка...</div>;
  }

  if (error) {
    const errorMessage = (error as any)?.response?.data?.error?.message || (error as any)?.message || 'Ошибка загрузки категорий';
    return (
      <div className="card text-center py-8">
        <div className="text-red-600 font-medium mb-2">Ошибка загрузки категорий</div>
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

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Категории товаров</h1>
        {hasPermission('products:create') && (
          <Link
            to="/categories/new"
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Добавить категорию
          </Link>
        )}
      </div>

      {categories.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <FolderTree className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 mb-4">Категории не найдены</p>
          {hasPermission('products:create') && (
            <Link
              to="/categories/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Создать первую категорию
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Название
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Описание
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Родительская категория
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Товары
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Подкатегории
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {rootCategories.map((category) => (
                <CategoryRow
                  key={category.id}
                  category={category}
                  allCategories={categories}
                  getChildren={getChildren}
                  onDelete={handleDelete}
                  hasPermission={hasPermission}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function CategoryRow({
  category,
  allCategories,
  getChildren,
  onDelete,
  hasPermission,
  level = 0,
}: {
  category: any;
  allCategories: any[];
  getChildren: (id: string) => any[];
  onDelete: (id: string) => void;
  hasPermission: (permission: string) => boolean;
  level?: number;
}) {
  const children = getChildren(category.id);
  const parent = category.parentId
    ? allCategories.find((c) => c.id === category.parentId)
    : null;

  return (
    <>
      <tr className={level > 0 ? 'bg-gray-50' : ''}>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center" style={{ paddingLeft: `${level * 24}px` }}>
            {level > 0 && <span className="text-gray-400 mr-2">└─</span>}
            <span className="text-sm font-medium text-gray-900">{category.name}</span>
          </div>
        </td>
        <td className="px-6 py-4">
          <div className="text-sm text-gray-500">
            {category.description || '-'}
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="text-sm text-gray-500">
            {parent ? parent.name : '-'}
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="text-sm text-gray-500">
            {category._count?.products || 0}
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="text-sm text-gray-500">
            {category._count?.children || 0}
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
          <div className="flex justify-end gap-2">
            <Link
              to={`/categories/${category.id}`}
              className="text-primary-600 hover:text-primary-900"
              title="Просмотр"
            >
              <Eye className="w-5 h-5" />
            </Link>
            {hasPermission('products:update') && (
              <Link
                to={`/categories/${category.id}/edit`}
                className="text-blue-600 hover:text-blue-900"
                title="Редактировать"
              >
                <Edit className="w-5 h-5" />
              </Link>
            )}
            {hasPermission('products:delete') && (
              <button
                onClick={() => onDelete(category.id)}
                className="text-red-600 hover:text-red-900"
                title="Удалить"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
          </div>
        </td>
      </tr>
      {children.map((child) => (
        <CategoryRow
          key={child.id}
          category={child}
          allCategories={allCategories}
          getChildren={getChildren}
          onDelete={onDelete}
          hasPermission={hasPermission}
          level={level + 1}
        />
      ))}
    </>
  );
}

