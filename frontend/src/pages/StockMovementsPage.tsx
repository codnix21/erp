import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Plus, Search, Package, Warehouse, ArrowUp, ArrowDown, RotateCcw, Lock, Unlock, Download } from 'lucide-react';
import { usePermissions } from '../hooks/usePermissions';
import { useNotifications } from '../context/NotificationContext';

const movementTypeLabels: Record<string, string> = {
  IN: 'Приход',
  OUT: 'Расход',
  TRANSFER: 'Перемещение',
  ADJUSTMENT: 'Корректировка',
  RESERVED: 'Резервирование',
  UNRESERVED: 'Снятие резерва',
};

const movementTypeIcons: Record<string, any> = {
  IN: ArrowUp,
  OUT: ArrowDown,
  TRANSFER: RotateCcw,
  ADJUSTMENT: RotateCcw,
  RESERVED: Lock,
  UNRESERVED: Unlock,
};

const movementTypeColors: Record<string, string> = {
  IN: 'text-green-600 bg-green-50',
  OUT: 'text-red-600 bg-red-50',
  TRANSFER: 'text-blue-600 bg-blue-50',
  ADJUSTMENT: 'text-yellow-600 bg-yellow-50',
  RESERVED: 'text-orange-600 bg-orange-50',
  UNRESERVED: 'text-purple-600 bg-purple-50',
};

export default function StockMovementsPage() {
  const [page, setPage] = useState(1);
  const [warehouseFilter, setWarehouseFilter] = useState('');
  const [productFilter, setProductFilter] = useState('');
  const [movementTypeFilter, setMovementTypeFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const { hasPermission } = usePermissions();
  const { error: showError } = useNotifications();

  const { data: warehousesData } = useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => {
      const response = await api.get('/warehouses', { params: { limit: 100 } });
      return response.data;
    },
  });

  const { data: productsData } = useQuery({
    queryKey: ['products', 'for-movements'],
    queryFn: async () => {
      const response = await api.get('/products', { params: { page: 1, limit: 100 } });
      return response.data;
    },
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['stock-movements', page, warehouseFilter, productFilter, movementTypeFilter, startDate, endDate],
    queryFn: async () => {
      const params: any = { page, limit: 50 };
      if (warehouseFilter) params.warehouseId = warehouseFilter;
      if (productFilter) params.productId = productFilter;
      if (movementTypeFilter) params.movementType = movementTypeFilter;
      if (startDate) params.dateFrom = startDate;
      if (endDate) params.dateTo = endDate;
      const response = await api.get('/stock-movements', { params });
      return response.data;
    },
  });

  if (isLoading) {
    return <div className="text-center py-8">Загрузка...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-600">Ошибка загрузки движений</div>;
  }

  const movements = data?.data || [];
  const meta = data?.meta || { total: 0, page: 1, limit: 50, totalPages: 0 };
  const warehouses = warehousesData?.data || [];
  const products = productsData?.data || [];

  const handleExport = async () => {
    try {
      const params: any = {};
      if (warehouseFilter) params.warehouseId = warehouseFilter;
      if (productFilter) params.productId = productFilter;
      if (movementTypeFilter) params.movementType = movementTypeFilter;
      if (startDate) params.dateFrom = startDate;
      if (endDate) params.dateTo = endDate;

      const response = await api.get('/export/stock-movements/excel', {
        params,
        responseType: 'blob',
      });

      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `stock_movements_${Date.now()}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error: any) {
      showError(error?.response?.data?.error?.message || 'Ошибка экспорта движений');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Package className="w-8 h-8" />
          Движения товаров
        </h1>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="btn btn-secondary flex items-center gap-2"
          >
            <Download className="w-5 h-5" />
            Экспорт в Excel
          </button>
          {hasPermission('stockMovements:create') && (
            <Link to="/stock-movements/new" className="btn btn-primary flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Создать движение
            </Link>
          )}
        </div>
      </div>

      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Склад
            </label>
            <select
              value={warehouseFilter}
              onChange={(e) => setWarehouseFilter(e.target.value)}
              className="input"
            >
              <option value="">Все склады</option>
              {warehouses.map((warehouse: any) => (
                <option key={warehouse.id} value={warehouse.id}>
                  {warehouse.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Товар
            </label>
            <select
              value={productFilter}
              onChange={(e) => setProductFilter(e.target.value)}
              className="input"
            >
              <option value="">Все товары</option>
              {products.map((product: any) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Тип движения
            </label>
            <select
              value={movementTypeFilter}
              onChange={(e) => setMovementTypeFilter(e.target.value)}
              className="input"
            >
              <option value="">Все типы</option>
              <option value="IN">Приход</option>
              <option value="OUT">Расход</option>
              <option value="TRANSFER">Перемещение</option>
              <option value="ADJUSTMENT">Корректировка</option>
              <option value="RESERVED">Резервирование</option>
              <option value="UNRESERVED">Снятие резерва</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              С
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              По
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="input"
            />
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="table">
          <thead>
            <tr>
              <th>Дата</th>
              <th>Склад</th>
              <th>Товар</th>
              <th>Тип</th>
              <th>Количество</th>
              <th>Пользователь</th>
              <th>Примечания</th>
            </tr>
          </thead>
          <tbody>
            {movements.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-gray-500">
                  Движения не найдены
                </td>
              </tr>
            ) : (
              movements.map((movement: any) => {
                const Icon = movementTypeIcons[movement.movementType] || Package;
                return (
                  <tr key={movement.id} className="hover:bg-gray-50">
                    <td>
                      {new Date(movement.createdAt).toLocaleString('ru-RU')}
                    </td>
                    <td>
                      <Link
                        to={`/warehouses/${movement.warehouse.id}`}
                        className="flex items-center gap-2 text-primary-600 hover:underline"
                      >
                        <Warehouse className="w-4 h-4" />
                        {movement.warehouse.name}
                      </Link>
                    </td>
                    <td>
                      <Link
                        to={`/products/${movement.product.id}`}
                        className="text-primary-600 hover:underline"
                      >
                        {movement.product.name}
                      </Link>
                      {movement.product.sku && (
                        <span className="text-gray-500 text-sm ml-2 font-mono">
                          ({movement.product.sku})
                        </span>
                      )}
                    </td>
                    <td>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${movementTypeColors[movement.movementType] || 'bg-gray-100 text-gray-800'}`}
                      >
                        <Icon className="w-3 h-3" />
                        {movementTypeLabels[movement.movementType] || movement.movementType}
                      </span>
                    </td>
                    <td className="font-medium">
                      <span
                        className={
                          movement.movementType === 'IN' || movement.movementType === 'UNRESERVED'
                            ? 'text-green-600'
                            : movement.movementType === 'OUT' || movement.movementType === 'RESERVED'
                            ? 'text-red-600'
                            : 'text-gray-600'
                        }
                      >
                        {movement.movementType === 'IN' || movement.movementType === 'UNRESERVED' ? '+' : ''}
                        {movement.movementType === 'OUT' || movement.movementType === 'RESERVED' ? '-' : ''}
                        {Number(movement.quantity).toLocaleString('ru-RU')}
                      </span>
                    </td>
                    <td className="text-sm text-gray-600">
                      {movement.createdBy
                        ? `${movement.createdBy.firstName || ''} ${movement.createdBy.lastName || ''}`.trim() ||
                          movement.createdBy.email
                        : 'Система'}
                    </td>
                    <td className="text-sm text-gray-600">
                      {movement.notes || '-'}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {meta.totalPages > 1 && (
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

