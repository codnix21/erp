import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../services/dashboardService';
import { Link } from 'react-router-dom';
import { Package, Users, FileText, TrendingUp, ArrowRight, AlertCircle, Receipt, CreditCard, Truck, Warehouse, Clock, AlertTriangle } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { usePermissions } from '../hooks/usePermissions';

const statusLabels: Record<string, string> = {
  DRAFT: 'Черновик',
  PENDING: 'Ожидает',
  CONFIRMED: 'Подтверждён',
  IN_PROGRESS: 'В работе',
  COMPLETED: 'Завершён',
  CANCELLED: 'Отменён',
};

export default function DashboardPage() {
  const { isAuthenticated, accessToken } = useAuthStore();
  const { hasPermission } = usePermissions();

  // Один запрос вместо 5 - значительно быстрее!
  const { data: dashboardData, error: dashboardError, isLoading } = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: () => dashboardService.getStats(),
    retry: 2,
    retryDelay: 1000,
    enabled: isAuthenticated && !!accessToken,
    staleTime: 30000, // Кэшируем на 30 секунд
  });

  const hasError = !!dashboardError;

  const stats = dashboardData?.data?.stats;
  const recentOrders = dashboardData?.data?.recentOrders || [];

  const statsCards = [
    {
      title: 'Заказы',
      value: stats?.orders || 0,
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      link: '/orders',
    },
    {
      title: 'Клиенты',
      value: stats?.customers || 0,
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      link: '/customers',
    },
    {
      title: 'Товары',
      value: stats?.products || 0,
      icon: Package,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      link: '/products',
    },
    {
      title: 'Выручка',
      value: `${(stats?.revenue || 0).toLocaleString('ru-RU')} ₽`,
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      link: '/orders',
    },
    {
      title: 'Счета',
      value: stats?.invoices || 0,
      icon: Receipt,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
      link: '/invoices',
    },
    {
      title: 'Платежи',
      value: stats?.payments || 0,
      icon: CreditCard,
      color: 'text-teal-600',
      bgColor: 'bg-teal-100',
      link: '/payments',
    },
    {
      title: 'Поставщики',
      value: stats?.suppliers || 0,
      icon: Truck,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-100',
      link: '/suppliers',
    },
    {
      title: 'Склады',
      value: stats?.warehouses || 0,
      icon: Warehouse,
      color: 'text-pink-600',
      bgColor: 'bg-pink-100',
      link: '/warehouses',
    },
  ];

  const alertCards = [
    {
      title: 'Заказы в работе',
      value: stats?.pendingOrders || 0,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      link: '/orders?status=PENDING',
    },
    {
      title: 'Неоплаченные счета',
      value: stats?.unpaidInvoices || 0,
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      link: '/invoices?status=ISSUED',
      amount: stats?.unpaidAmount || 0,
    },
  ];

  if (!isAuthenticated || !accessToken) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <p className="text-lg text-gray-600">Необходима авторизация</p>
          <Link to="/login" className="btn btn-primary mt-4">
            Войти в систему
          </Link>
        </div>
      </div>
    );
  }

  if (hasError) {
    const errorMessage = 
      (dashboardError as any)?.response?.data?.error?.message ||
      'Ошибка загрузки данных';

    return (
      <div>
        <h1 className="text-3xl font-bold mb-6">Главная</h1>
        <div className="card bg-red-50 border-red-200">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-red-600" />
            <div>
              <p className="font-semibold text-red-800">Ошибка загрузки данных</p>
              <p className="text-sm text-red-600 mt-1">{errorMessage}</p>
              <button
                onClick={() => window.location.reload()}
                className="btn btn-sm btn-secondary mt-2"
              >
                Обновить страницу
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Главная</h1>

      {isLoading && (
        <div className="card mb-6">
          <p className="text-center text-gray-600">Загрузка данных...</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsCards.map((stat) => (
          <Link
            key={stat.title}
            to={stat.link}
            className="card hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                <p className="text-3xl font-bold">{stat.value}</p>
              </div>
              <div className={`${stat.bgColor} p-3 rounded-lg`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {alertCards.some((card) => card.value > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {alertCards.map((alert) => (
            <Link
              key={alert.title}
              to={alert.link}
              className="card hover:shadow-lg transition-shadow border-l-4 border-yellow-500"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{alert.title}</p>
                  <p className="text-2xl font-bold">{alert.value}</p>
                  {alert.amount && alert.amount > 0 && (
                    <p className="text-sm text-gray-500 mt-1">
                      Сумма: {alert.amount.toLocaleString('ru-RU')} ₽
                    </p>
                  )}
                </div>
                <div className={`${alert.bgColor} p-3 rounded-lg`}>
                  <alert.icon className={`w-6 h-6 ${alert.color}`} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Последние заказы</h2>
            <Link
              to="/orders"
              className="text-primary-600 hover:text-primary-700 text-sm flex items-center gap-1"
            >
              Все заказы
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          {recentOrders.map((order: any) => (
            <Link
              key={order.id}
              to={`/orders/${order.id}`}
              className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50 mb-2"
            >
              <div>
                <p className="font-medium">{order.orderNumber}</p>
                <p className="text-sm text-gray-600">
                  {order.customer?.name || order.supplier?.name || 'Без клиента'}
                </p>
              </div>
              <div className="text-right">
                <p className="font-medium">
                  {Number(order.totalAmount).toLocaleString('ru-RU')} {order.currency}
                </p>
                <p className="text-sm text-gray-600">
                  {statusLabels[order.status] || (order.status ? 'Неизвестный статус' : 'Без статуса')}
                </p>
              </div>
            </Link>
          )) || <p className="text-gray-500 text-center py-4">Нет заказов</p>}
        </div>

        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Быстрые действия</h2>
          </div>
          <div className="space-y-2">
            {hasPermission('orders:create') && (
              <Link
                to="/orders/new"
                className="block w-full btn btn-primary text-left"
              >
                Создать заказ
              </Link>
            )}
            {hasPermission('products:create') && (
              <Link
                to="/products/new"
                className="block w-full btn btn-secondary text-left"
              >
                Добавить товар
              </Link>
            )}
            {hasPermission('customers:create') && (
              <Link
                to="/customers/new"
                className="block w-full btn btn-secondary text-left"
              >
                Добавить клиента
              </Link>
            )}
            {hasPermission('invoices:create') && (
              <Link
                to="/invoices/new"
                className="block w-full btn btn-secondary text-left"
              >
                Создать счёт
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
