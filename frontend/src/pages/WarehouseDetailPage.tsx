import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { ArrowLeft, Package, TrendingUp, TrendingDown } from 'lucide-react';
import { usePermissions } from '../hooks/usePermissions';

interface Warehouse {
  id: string;
  name: string;
  address?: string;
  isActive: boolean;
}

export default function WarehouseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { hasPermission } = usePermissions();

  const { data: warehouseData, isLoading: warehouseLoading } = useQuery({
    queryKey: ['warehouse', id],
    queryFn: async () => {
      const response = await api.get(`/warehouses/${id}`);
      return response.data;
    },
    enabled: !!id,
  });

  const { data: stockData, isLoading: stockLoading } = useQuery({
    queryKey: ['stock', id],
    queryFn: async () => {
      const response = await api.get('/stock', { params: { warehouseId: id } });
      return response.data;
    },
    enabled: !!id,
  });

  const { data: movementsData, isLoading: movementsLoading } = useQuery({
    queryKey: ['stock-movements', id],
    queryFn: async () => {
      const response = await api.get('/stock-movements', {
        params: { warehouseId: id, limit: 20 },
      });
      return response.data;
    },
    enabled: !!id,
  });

  if (warehouseLoading) {
    return <div className="text-center py-8">Загрузка...</div>;
  }

  if (!warehouseData?.data) {
    return (
      <div className="text-center py-8 text-red-600">
        Склад не найден
      </div>
    );
  }

  const warehouse: Warehouse = warehouseData.data;
  const stock = stockData?.data || [];
  const movements = movementsData?.data || [];

  const totalProducts = stock.length;
  const totalQuantity = stock.reduce(
    (sum: number, item: any) => sum + Number(item.quantity || 0),
    0
  );

  return (
    <div>
      <Link
        to="/warehouses"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Назад к складам
      </Link>

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">{warehouse.name}</h1>
          {warehouse.address && (
            <p className="text-gray-600 mt-1">{warehouse.address}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {hasPermission('warehouses:update') && (
            <Link
              to={`/warehouses/${warehouse.id}/edit`}
              className="btn btn-secondary flex items-center gap-2"
            >
              Редактировать
            </Link>
          )}
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              warehouse.isActive
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {warehouse.isActive ? 'Активен' : 'Неактивен'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="card">
          <div className="flex items-center gap-3">
            <Package className="w-8 h-8 text-primary-600" />
            <div>
              <p className="text-sm text-gray-600">Товаров на складе</p>
              <p className="text-2xl font-bold">{totalProducts}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-sm text-gray-600">Общее количество</p>
              <p className="text-2xl font-bold">{totalQuantity.toLocaleString('ru-RU')}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <TrendingDown className="w-8 h-8 text-orange-600" />
            <div>
              <p className="text-sm text-gray-600">В резерве</p>
              <p className="text-2xl font-bold">
                {stock
                  .reduce((sum: number, item: any) => sum + Number(item.reserved || 0), 0)
                  .toLocaleString('ru-RU')}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Остатки товаров</h2>
          {stockLoading ? (
            <div className="text-center py-4">Загрузка...</div>
          ) : stock.length === 0 ? (
            <p className="text-gray-500 text-center py-4">Нет товаров на складе</p>
          ) : (
            <div className="space-y-2">
              {stock.slice(0, 10).map((item: any) => (
                <div
                  key={`${item.warehouseId}-${item.productId}`}
                  className="flex justify-between items-center p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{item.product.name}</p>
                    <p className="text-sm text-gray-600">
                      {item.product.sku || 'без артикула'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      {Number(item.quantity).toLocaleString('ru-RU')} {item.product.unit}
                    </p>
                    {Number(item.reserved) > 0 && (
                      <p className="text-sm text-orange-600">
                        Резерв: {Number(item.reserved).toLocaleString('ru-RU')}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Последние движения</h2>
          {movementsLoading ? (
            <div className="text-center py-4">Загрузка...</div>
          ) : movements.length === 0 ? (
            <p className="text-gray-500 text-center py-4">Нет движений</p>
          ) : (
            <div className="space-y-2">
              {movements.map((movement: any) => (
                <div
                  key={movement.id}
                  className="flex justify-between items-center p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{movement.product.name}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(movement.createdAt).toLocaleString('ru-RU')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-medium ${
                        movement.movementType === 'IN'
                          ? 'text-green-600'
                          : movement.movementType === 'OUT'
                          ? 'text-red-600'
                          : 'text-gray-600'
                      }`}
                    >
                      {movement.movementType === 'IN' ? '+' : '-'}
                      {Number(movement.quantity).toLocaleString('ru-RU')}
                    </p>
                    <p className="text-sm text-gray-600">{movement.movementType}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

