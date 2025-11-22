import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { productService } from '../services/productService';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { usePermissions } from '../hooks/usePermissions';

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['product', id],
    queryFn: () => productService.getOne(id!),
    enabled: !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: () => productService.delete(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      navigate('/products');
    },
  });

  if (isLoading) {
    return <div className="text-center py-8">Загрузка...</div>;
  }

  if (error || !data?.data) {
    return (
      <div className="text-center py-8 text-red-600">
        Ошибка загрузки товара или товар не найден
      </div>
    );
  }

  const product = data.data;

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
        to="/products"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Назад к товарам
      </Link>

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">{product.name}</h1>
          {product.sku && (
            <p className="text-gray-600 mt-1 font-mono">Артикул: {product.sku}</p>
          )}
        </div>
        <div className="flex gap-2">
          {hasPermission('products:update') && (
            <Link
              to={`/products/${id}/edit`}
              className="btn btn-secondary flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Редактировать
            </Link>
          )}
          {hasPermission('products:delete') && (
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
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Информация о товаре</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Название</p>
                <p className="font-medium">{product.name}</p>
              </div>
              {product.description && (
                <div>
                  <p className="text-sm text-gray-600">Описание</p>
                  <p className="font-medium">{product.description}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Единица измерения</p>
                  <p className="font-medium">{product.unit}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Тип</p>
                  <p className="font-medium">
                    {product.isService ? 'Услуга' : 'Товар'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="card mb-6">
            <h2 className="text-xl font-semibold mb-4">Ценообразование</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Цена</p>
                <p className="text-2xl font-bold text-primary-600">
                  {Number(product.price).toLocaleString('ru-RU')} {product.currency}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">НДС</p>
                <p className="font-medium">{Number(product.taxRate)}%</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Цена с НДС</p>
                <p className="font-medium">
                  {(
                    Number(product.price) *
                    (1 + Number(product.taxRate) / 100)
                  ).toLocaleString('ru-RU')}{' '}
                  {product.currency}
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Статус</h2>
            <div>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  product.isActive
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {product.isActive ? 'Активен' : 'Неактивен'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

