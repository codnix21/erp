import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { FileText, TrendingUp, Package, DollarSign, Download } from 'lucide-react';
import { Link } from 'react-router-dom';

const invoiceStatusLabels: Record<string, string> = {
  DRAFT: 'Черновик',
  ISSUED: 'Выставлен',
  PAID: 'Оплачен',
  PARTIALLY_PAID: 'Частично оплачен',
  OVERDUE: 'Просрочен',
  CANCELLED: 'Отменён',
};

export default function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState<string | null>('sales'); // По умолчанию выбираем отчёт по продажам
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { data: salesReport, isLoading: salesLoading, error: salesError } = useQuery({
    queryKey: ['reports', 'sales', startDate, endDate],
    queryFn: async () => {
      const params: any = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const response = await api.get('/reports/sales', { params });
      // Проверяем структуру ответа
      if (response.data && response.data.data) {
        return response.data;
      }
      // Если данные пришли напрямую
      if (response.data && response.data.summary) {
        return { data: response.data };
      }
      return response.data;
    },
    enabled: selectedReport === 'sales',
  });

  const { data: purchasesReport, isLoading: purchasesLoading, error: purchasesError } = useQuery({
    queryKey: ['reports', 'purchases', startDate, endDate],
    queryFn: async () => {
      const params: any = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const response = await api.get('/reports/purchases', { params });
      return response.data;
    },
    enabled: selectedReport === 'purchases',
  });

  const { data: warehouseReport, isLoading: warehouseLoading, error: warehouseError } = useQuery({
    queryKey: ['reports', 'warehouse'],
    queryFn: async () => {
      const response = await api.get('/reports/warehouse');
      return response.data;
    },
    enabled: selectedReport === 'warehouse',
  });

  const { data: financialReport, isLoading: financialLoading, error: financialError } = useQuery({
    queryKey: ['reports', 'financial', startDate, endDate],
    queryFn: async () => {
      const params: any = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const response = await api.get('/reports/financial', { params });
      return response.data;
    },
    enabled: selectedReport === 'financial',
  });

  const handleExport = async (type: string, format: 'excel' | 'pdf') => {
    try {
      const params: any = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      let url = '';
      if (type === 'orders') {
        url = `/export/orders/${format === 'excel' ? 'excel' : 'pdf'}`;
      } else if (type === 'invoices') {
        url = `/export/invoices/${format === 'excel' ? 'excel' : 'pdf'}`;
      } else if (type === 'products') {
        url = '/export/products/excel';
      }

      const response = await api.get(url, {
        params,
        responseType: 'blob',
      });

      const blob = new Blob([response.data], {
        type: format === 'excel' 
          ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          : 'application/pdf'
      });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${type}_${Date.now()}.${format === 'excel' ? 'xlsx' : 'pdf'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error: any) {
      console.error('Export error:', error);
      alert(`Ошибка экспорта: ${error?.response?.data?.error?.message || 'Неизвестная ошибка'}`);
    }
  };

  const reports = [
    {
      id: 'sales',
      title: 'Отчёт по продажам',
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      id: 'purchases',
      title: 'Отчёт по закупкам',
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      id: 'warehouse',
      title: 'Отчёт по складу',
      icon: Package,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      id: 'financial',
      title: 'Финансовый отчёт',
      icon: DollarSign,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Отчёты и аналитика</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {reports.map((report) => (
          <button
            key={report.id}
            onClick={() => setSelectedReport(report.id)}
            className={`card text-left hover:shadow-lg transition-shadow ${
              selectedReport === report.id ? 'ring-2 ring-primary-500' : ''
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`${report.bgColor} p-3 rounded-lg`}>
                <report.icon className={`w-6 h-6 ${report.color}`} />
              </div>
              <div>
                <p className="font-medium">{report.title}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {(selectedReport === 'sales' ||
        selectedReport === 'purchases' ||
        selectedReport === 'financial') && (
        <div className="card mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Период</h2>
            {(startDate || endDate) && (
              <button
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                }}
                className="text-sm text-gray-600 hover:text-gray-800 underline"
              >
                Сбросить период
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Начало периода
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="input"
                placeholder="дд.мм.гггг"
              />
              {startDate && (
                <p className="text-xs text-gray-500 mt-1">
                  Выбрано: {new Date(startDate).toLocaleDateString('ru-RU')}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Конец периода
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="input"
                placeholder="дд.мм.гггг"
                min={startDate || undefined}
              />
              {endDate && (
                <p className="text-xs text-gray-500 mt-1">
                  Выбрано: {new Date(endDate).toLocaleDateString('ru-RU')}
                </p>
              )}
            </div>
          </div>
          <div className="mt-4 space-y-2">
            {((selectedReport === 'sales' && salesReport?.data?.availableDates) ||
              (selectedReport === 'purchases' && purchasesReport?.data?.availableDates) ||
              (selectedReport === 'financial' && financialReport?.data?.availableDates)) && (
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-green-800 mb-1">Доступные данные:</p>
                    <p className="text-sm text-green-700">
                      {selectedReport === 'sales' && salesReport?.data?.availableDates?.first && (
                        <>
                          Первая операция: {new Date(salesReport.data.availableDates.first).toLocaleDateString('ru-RU')}
                          {salesReport.data.availableDates.last && (
                            <> • Последняя: {new Date(salesReport.data.availableDates.last).toLocaleDateString('ru-RU')}</>
                          )}
                        </>
                      )}
                      {selectedReport === 'purchases' && purchasesReport?.data?.availableDates?.first && (
                        <>
                          Первая операция: {new Date(purchasesReport.data.availableDates.first).toLocaleDateString('ru-RU')}
                          {purchasesReport.data.availableDates.last && (
                            <> • Последняя: {new Date(purchasesReport.data.availableDates.last).toLocaleDateString('ru-RU')}</>
                          )}
                        </>
                      )}
                      {selectedReport === 'financial' && financialReport?.data?.availableDates?.first && (
                        <>
                          Первый счёт: {new Date(financialReport.data.availableDates.first).toLocaleDateString('ru-RU')}
                          {financialReport.data.availableDates.last && (
                            <> • Последний: {new Date(financialReport.data.availableDates.last).toLocaleDateString('ru-RU')}</>
                          )}
                        </>
                      )}
                    </p>
                  </div>
                  {((selectedReport === 'sales' && salesReport?.data?.availableDates?.first) ||
                    (selectedReport === 'purchases' && purchasesReport?.data?.availableDates?.first) ||
                    (selectedReport === 'financial' && financialReport?.data?.availableDates?.first)) && (
                    <button
                      onClick={() => {
                        const dates = 
                          selectedReport === 'sales' ? salesReport?.data?.availableDates :
                          selectedReport === 'purchases' ? purchasesReport?.data?.availableDates :
                          financialReport?.data?.availableDates;
                        if (dates?.first && dates?.last) {
                          setStartDate(new Date(dates.first).toISOString().split('T')[0]);
                          setEndDate(new Date(dates.last).toISOString().split('T')[0]);
                        }
                      }}
                      className="text-xs text-green-700 hover:text-green-900 underline whitespace-nowrap ml-2"
                    >
                      Выбрать весь период
                    </button>
                  )}
                </div>
              </div>
            )}
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                {startDate && endDate
                  ? `Выбранный период: с ${new Date(startDate).toLocaleDateString('ru-RU')} по ${new Date(endDate).toLocaleDateString('ru-RU')}`
                  : startDate
                  ? `Выбранный период: с ${new Date(startDate).toLocaleDateString('ru-RU')}`
                  : endDate
                  ? `Выбранный период: по ${new Date(endDate).toLocaleDateString('ru-RU')}`
                  : 'Период не выбран. Будут показаны данные за весь период.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {selectedReport === 'sales' && (
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Отчёт по продажам</h2>
            <button
              onClick={() => handleExport('orders', 'excel')}
              className="btn btn-secondary flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Экспорт в Excel
            </button>
          </div>
          {salesLoading ? (
            <div className="text-center py-8">Загрузка...</div>
          ) : salesError ? (
            <div className="text-center py-8 text-red-600">
              Ошибка загрузки отчёта: {(salesError as any)?.response?.data?.error?.message || 'Неизвестная ошибка'}
            </div>
          ) : salesReport?.data ? (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Всего заказов</p>
                  <p className="text-2xl font-bold">
                    {salesReport.data.summary?.totalOrders || 0}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Общая выручка</p>
                  <p className="text-2xl font-bold">
                    {(salesReport.data.summary?.totalRevenue || 0).toLocaleString('ru-RU')} ₽
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Средний чек</p>
                  <p className="text-2xl font-bold">
                    {(salesReport.data.summary?.averageOrderValue || 0).toLocaleString('ru-RU')} ₽
                  </p>
                </div>
              </div>
              {salesReport.data.recentOrders && salesReport.data.recentOrders.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Последние операции</h3>
                  <div className="space-y-2 mb-4">
                    {salesReport.data.recentOrders.map((order: any, index: number) => (
                      <div
                        key={index}
                        className="flex justify-between items-center p-3 border rounded-lg bg-white"
                      >
                        <div>
                          <p className="font-medium">Заказ {order.orderNumber}</p>
                          <p className="text-sm text-gray-600">
                            {order.customer} • {new Date(order.date).toLocaleDateString('ru-RU', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                        <p className="font-medium">
                          {(order.amount || 0).toLocaleString('ru-RU')} ₽
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {salesReport.data.topProducts && salesReport.data.topProducts.length > 0 ? (
                <div>
                  <h3 className="font-semibold mb-2">Топ товаров</h3>
                  <div className="space-y-2">
                    {salesReport.data.topProducts.map((product: any, index: number) => (
                      <div
                        key={index}
                        className="flex justify-between items-center p-3 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{product.product?.name || product.name || 'Неизвестный товар'}</p>
                          <p className="text-sm text-gray-600">
                            Продано: {product.quantity || 0}
                          </p>
                        </div>
                        <p className="font-medium">
                          {(product.revenue || 0).toLocaleString('ru-RU')} ₽
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Нет данных о товарах за выбранный период
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              {startDate || endDate 
                ? 'Нет данных за выбранный период. Попробуйте выбрать другой период или оставьте поля пустыми для отчёта за весь период.'
                : 'Данные будут загружены автоматически. Выберите период для фильтрации или оставьте поля пустыми для отчёта за весь период.'}
            </div>
          )}
        </div>
      )}

      {selectedReport === 'financial' && (
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Финансовый отчёт</h2>
            <button
              onClick={() => handleExport('invoices', 'excel')}
              className="btn btn-secondary flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Экспорт в Excel
            </button>
          </div>
          {financialLoading ? (
            <div className="text-center py-8">Загрузка...</div>
          ) : financialError ? (
            <div className="text-center py-8 text-red-600">
              Ошибка загрузки отчёта: {(financialError as any)?.response?.data?.error?.message || 'Неизвестная ошибка'}
            </div>
          ) : financialReport?.data ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Выставлено</p>
                  <p className="text-2xl font-bold">
                    {(financialReport.data.summary?.totalInvoiced || 0).toLocaleString('ru-RU')} ₽
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Оплачено</p>
                  <p className="text-2xl font-bold text-green-600">
                    {(financialReport.data.summary?.totalPaid || 0).toLocaleString('ru-RU')} ₽
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Остаток</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {(financialReport.data.summary?.totalOutstanding || 0).toLocaleString('ru-RU')} ₽
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Всего платежей</p>
                  <p className="text-2xl font-bold">
                    {financialReport.data.summary?.totalPayments || 0}
                  </p>
                </div>
              </div>
              {financialReport.data.byStatus && Object.keys(financialReport.data.byStatus).length > 0 ? (
                <div>
                  <h3 className="font-semibold mb-2">По статусам</h3>
                  <div className="grid grid-cols-5 gap-2">
                    {Object.entries(financialReport.data.byStatus).map(([status, count]: [string, any]) => (
                      <div key={status} className="p-3 bg-gray-50 rounded-lg text-center">
                        <p className="text-sm text-gray-600">{invoiceStatusLabels[status] || (status ? 'Неизвестный статус' : 'Без статуса')}</p>
                        <p className="text-xl font-bold">{count || 0}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      )}

      {selectedReport === 'warehouse' && (
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Отчёт по складу</h2>
          {warehouseLoading ? (
            <div className="text-center py-8">Загрузка...</div>
          ) : warehouseError ? (
            <div className="text-center py-8 text-red-600">
              Ошибка загрузки отчёта: {(warehouseError as any)?.response?.data?.error?.message || 'Неизвестная ошибка'}
            </div>
          ) : warehouseReport?.data ? (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Остатки товаров</h3>
                {warehouseReport.data.stock && warehouseReport.data.stock.length > 0 ? (
                  <div className="space-y-2">
                    {warehouseReport.data.stock.slice(0, 20).map((item: any, index: number) => (
                      <div
                        key={index}
                        className="flex justify-between items-center p-3 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{item.productName || 'Неизвестный товар'}</p>
                          <p className="text-sm text-gray-600">
                            {item.warehouseName || 'Неизвестный склад'} • {item.sku || 'без артикула'}
                          </p>
                        </div>
                        <p className="font-medium">{item.quantity || 0}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Нет данных об остатках товаров
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      )}

      {selectedReport === 'purchases' && (
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Отчёт по закупкам</h2>
            <button
              onClick={() => handleExport('orders', 'excel')}
              className="btn btn-secondary flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Экспорт в Excel
            </button>
          </div>
          {purchasesLoading ? (
            <div className="text-center py-8">Загрузка...</div>
          ) : purchasesError ? (
            <div className="text-center py-8 text-red-600">
              Ошибка загрузки отчёта: {(purchasesError as any)?.response?.data?.error?.message || 'Неизвестная ошибка'}
            </div>
          ) : purchasesReport?.data ? (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Всего закупок</p>
                  <p className="text-2xl font-bold">
                    {purchasesReport.data.summary?.totalOrders || 0}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Общая сумма</p>
                  <p className="text-2xl font-bold">
                    {(purchasesReport.data.summary?.totalAmount || 0).toLocaleString('ru-RU')} ₽
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Средний чек</p>
                  <p className="text-2xl font-bold">
                    {(purchasesReport.data.summary?.averageOrderValue || 0).toLocaleString('ru-RU')} ₽
                  </p>
                </div>
              </div>
              {purchasesReport.data.topProducts && purchasesReport.data.topProducts.length > 0 ? (
                <div>
                  <h3 className="font-semibold mb-2">Топ товаров</h3>
                  <div className="space-y-2">
                    {purchasesReport.data.topProducts.map((product: any, index: number) => (
                      <div
                        key={index}
                        className="flex justify-between items-center p-3 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{product.product?.name || product.name || 'Неизвестный товар'}</p>
                          <p className="text-sm text-gray-600">
                            Закуплено: {product.quantity || 0}
                          </p>
                        </div>
                        <p className="font-medium">
                          {(product.amount || 0).toLocaleString('ru-RU')} ₽
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Нет данных о товарах за выбранный период
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              {startDate || endDate 
                ? 'Нет данных за выбранный период. Попробуйте выбрать другой период или оставьте поля пустыми для отчёта за весь период.'
                : 'Данные будут загружены автоматически. Выберите период для фильтрации или оставьте поля пустыми для отчёта за весь период.'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

