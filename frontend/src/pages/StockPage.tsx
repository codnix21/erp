import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { Package, Warehouse, Search, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

interface StockItem {
  warehouseId: string;
  warehouse: { id: string; name: string };
  productId: string;
  product: { id: string; name: string; sku?: string; unit: string };
  quantity: number;
  reserved: number;
  available: number;
  lastMovement: string;
}

export default function StockPage() {
  const [warehouseFilter, setWarehouseFilter] = useState<string>('');
  const [search, setSearch] = useState('');

  const { data: warehousesData } = useQuery({
    queryKey: ['warehouses'],
    queryFn: async () => {
      const response = await api.get('/warehouses', { params: { limit: 100 } });
      return response.data;
    },
  });

  const { data: stockData, isLoading } = useQuery({
    queryKey: ['stock', warehouseFilter],
    queryFn: async () => {
      const response = await api.get('/stock', {
        params: warehouseFilter ? { warehouseId: warehouseFilter } : {},
      });
      return response.data;
    },
  });

  if (isLoading) {
    return <div className="text-center py-8">Загрузка...</div>;
  }

  const warehouses = warehousesData?.data || [];
  let stock: StockItem[] = stockData?.data || [];

  if (search) {
    stock = stock.filter(
      (item) =>
        item.product.name.toLowerCase().includes(search.toLowerCase()) ||
        item.product.sku?.toLowerCase().includes(search.toLowerCase())
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Package className="w-8 h-8" />
          Остатки на складах
        </h1>
        <Link to="/stock-movements/new" className="btn btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Создать движение
        </Link>
      </div>

      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Поиск по товару..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-10"
            />
          </div>
          <div>
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
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="table">
          <thead>
            <tr>
              <th>Склад</th>
              <th>Товар</th>
              <th>Артикул</th>
              <th>Остаток</th>
              <th>В резерве</th>
              <th>Доступно</th>
              <th>Последнее движение</th>
            </tr>
          </thead>
          <tbody>
            {stock.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-gray-500">
                  Товары не найдены
                </td>
              </tr>
            ) : (
              stock.map((item) => (
                <tr key={`${item.warehouseId}-${item.productId}`} className="hover:bg-gray-50">
                  <td>
                    <div className="flex items-center gap-2">
                      <Warehouse className="w-4 h-4 text-gray-400" />
                      {item.warehouse.name}
                    </div>
                  </td>
                  <td className="font-medium">{item.product.name}</td>
                  <td className="font-mono text-sm">{item.product.sku || '-'}</td>
                  <td>{Number(item.quantity).toLocaleString('ru-RU')}</td>
                  <td className="text-orange-600">
                    {Number(item.reserved).toLocaleString('ru-RU')}
                  </td>
                  <td className="text-green-600 font-medium">
                    {Number(item.available).toLocaleString('ru-RU')} {item.product.unit}
                  </td>
                  <td className="text-sm text-gray-600">
                    {new Date(item.lastMovement).toLocaleDateString('ru-RU')}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

