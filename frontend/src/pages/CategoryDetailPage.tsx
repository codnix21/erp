import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { categoryService } from '../services/categoryService';
import { ArrowLeft, Edit, Trash2, FolderTree, Package } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { usePermissions } from '../hooks/usePermissions';

export default function CategoryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { success, error: showError } = useNotifications();
  const { hasPermission } = usePermissions();

  const { data, isLoading, error } = useQuery({
    queryKey: ['category', id],
    queryFn: () => categoryService.getOne(id!),
    enabled: !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: () => categoryService.delete(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      success('Категория удалена');
      navigate('/categories');
    },
    onError: (err: any) => {
      showError(err.response?.data?.error?.message || 'Ошибка при удалении категории');
    },
  });

  const handleDelete = () => {
    if (window.confirm('Вы уверены, что хотите удалить эту категорию?')) {
      deleteMutation.mutate();
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Загрузка...</div>;
  }

  if (error || !data?.data) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">Категория не найдена</p>
        <Link to="/categories" className="text-primary-600 hover:underline">
          Вернуться к категориям
        </Link>
      </div>
    );
  }

  const category = data.data;

  return (
    <div>
      <Link
        to="/categories"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Назад к категориям
      </Link>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">{category.name}</h1>
        <div className="flex gap-2">
          {hasPermission('products:update') && (
            <Link
              to={`/categories/${id}/edit`}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Edit className="w-5 h-5" />
              Редактировать
            </Link>
          )}
          {hasPermission('products:delete') && (
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              disabled={deleteMutation.isPending}
            >
              <Trash2 className="w-5 h-5" />
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
              <label className="text-sm font-medium text-gray-500">Название</label>
              <p className="text-gray-900">{category.name}</p>
            </div>
            {category.description && (
              <div>
                <label className="text-sm font-medium text-gray-500">Описание</label>
                <p className="text-gray-900">{category.description}</p>
              </div>
            )}
            {category.parent && (
              <div>
                <label className="text-sm font-medium text-gray-500">Родительская категория</label>
                <Link
                  to={`/categories/${category.parent.id}`}
                  className="text-primary-600 hover:underline"
                >
                  {category.parent.name}
                </Link>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-gray-500">Дата создания</label>
              <p className="text-gray-900">
                {new Date(category.createdAt).toLocaleDateString('ru-RU')}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Статистика</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Package className="w-8 h-8 text-primary-600" />
              <div>
                <p className="text-sm text-gray-500">Товаров в категории</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(category as any).products?.length || 0}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <FolderTree className="w-8 h-8 text-primary-600" />
              <div>
                <p className="text-sm text-gray-500">Подкатегорий</p>
                <p className="text-2xl font-bold text-gray-900">
                  {category.children?.length || 0}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {category.children && category.children.length > 0 && (
        <div className="card mt-6">
          <h2 className="text-xl font-semibold mb-4">Подкатегории</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {category.children.map((child) => (
              <Link
                key={child.id}
                to={`/categories/${child.id}`}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <h3 className="font-medium text-gray-900">{child.name}</h3>
              </Link>
            ))}
          </div>
        </div>
      )}

      {(category as any).products && (category as any).products.length > 0 && (
        <div className="card mt-6">
          <h2 className="text-xl font-semibold mb-4">Товары в категории</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Название
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Артикул
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Цена
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {(category as any).products.map((product: any) => (
                  <tr key={product.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        to={`/products/${product.id}`}
                        className="text-primary-600 hover:underline"
                      >
                        {product.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.sku || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {Number(product.price).toLocaleString('ru-RU', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{' '}
                      ₽
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

