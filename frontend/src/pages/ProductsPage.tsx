import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { productService } from '../services/productService';
import api from '../services/api';
import { Product } from '../types';
import { Plus, Search, Package, Download, Upload } from 'lucide-react';
import { usePermissions } from '../hooks/usePermissions';

export default function ProductsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const { hasPermission } = usePermissions();

  const handleExport = async () => {
    try {
      const response = await api.get('/export/products/excel', {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `products_${Date.now()}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error: any) {
      console.error('Export error:', error);
      const errorMessage = error?.response?.data?.error?.message || 'Ошибка экспорта';
      alert(`Не удалось экспортировать товары: ${errorMessage}`);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/import/products/excel', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      alert(`Импортировано: ${response.data.data.success}, ошибок: ${response.data.data.errors.length}`);
      window.location.reload();
    } catch (error) {
      console.error('Import error:', error);
      alert('Ошибка импорта');
    }
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ['products', page, search],
    queryFn: () => productService.getAll({ page, limit: 20, search: search || undefined }),
  });

  if (isLoading) {
    return <div className="text-center py-8">Загрузка...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-600">Ошибка загрузки товаров</div>;
  }

  const products = data?.data || [];
  const meta = data?.meta;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Package className="w-8 h-8" />
          Товары
        </h1>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="btn btn-secondary flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Экспорт
          </button>
          <label className="btn btn-secondary flex items-center gap-2 cursor-pointer">
            <Upload className="w-4 h-4" />
            Импорт
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleImport}
              className="hidden"
            />
          </label>
          {hasPermission('products:create') && (
            <Link to="/products/new" className="btn btn-primary flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Добавить товар
            </Link>
          )}
        </div>
      </div>

      <div className="card mb-6">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Поиск по названию, артикулу..."
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
              <th>Артикул</th>
              <th>Название</th>
              <th>Категория</th>
              <th>Цена</th>
              <th>Ед. изм.</th>
              <th>Тип</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-gray-500">
                  Товары не найдены
                </td>
              </tr>
            ) : (
              products.map((product: Product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="font-mono text-sm">{product.sku || '-'}</td>
                  <td className="font-medium">{product.name}</td>
                  <td>{product.categoryId ? 'Категория' : '-'}</td>
                  <td>
                    {Number(product.price).toLocaleString('ru-RU')} {product.currency}
                  </td>
                  <td>{product.unit}</td>
                  <td>
                    <span className={`px-2 py-1 rounded-full text-xs ${product.isService ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                      {product.isService ? 'Услуга' : 'Товар'}
                    </span>
                  </td>
                  <td>
                    <Link
                      to={`/products/${product.id}`}
                      className="text-primary-600 hover:text-primary-700 font-medium mr-3"
                    >
                      Открыть
                    </Link>
                    {hasPermission('products:update') && (
                      <Link
                        to={`/products/${product.id}/edit`}
                        className="text-gray-600 hover:text-gray-800 text-sm"
                      >
                        Редактировать
                      </Link>
                    )}
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

