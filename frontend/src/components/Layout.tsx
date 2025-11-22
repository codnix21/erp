import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { usePermissions } from '../hooks/usePermissions';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { LogOut, Package, Home, FileText, Users, Warehouse, Receipt, CreditCard, Truck, BarChart3, FileBarChart, Shield, UserCog, Building2 } from 'lucide-react';

const roleLabels: Record<string, string> = {
  Admin: 'Администратор',
  Manager: 'Менеджер',
  Accountant: 'Бухгалтер',
  Warehouse: 'Складской',
};

export default function Layout() {
  const { user, logout } = useAuthStore();
  const { hasPermission } = usePermissions();
  const navigate = useNavigate();

  // Получаем название компании
  const { data: companyData } = useQuery({
    queryKey: ['company', user?.companyId],
    queryFn: async () => {
      if (!user?.companyId) return null;
      const response = await api.get(`/companies/${user.companyId}`);
      return response.data;
    },
    enabled: !!user?.companyId,
    staleTime: 5 * 60 * 1000, // Кэш на 5 минут
  });

  const companyName = companyData?.data?.name || user?.companyId;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-white shadow-lg">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-primary-600">ERP System</h1>
        </div>
        <nav className="px-4">
          <Link
            to="/"
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <Home className="w-5 h-5" />
            <span>Главная</span>
          </Link>
          {hasPermission('orders:read') && (
            <Link
              to="/orders"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <FileText className="w-5 h-5" />
              <span>Заказы</span>
            </Link>
          )}
          {hasPermission('products:read') && (
            <Link
              to="/products"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <Package className="w-5 h-5" />
              <span>Товары</span>
            </Link>
          )}
          {hasPermission('customers:read') && (
            <Link
              to="/customers"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <Users className="w-5 h-5" />
              <span>Клиенты</span>
            </Link>
          )}
          {hasPermission('warehouses:read') && (
            <Link
              to="/warehouses"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <Warehouse className="w-5 h-5" />
              <span>Склады</span>
            </Link>
          )}
          {hasPermission('invoices:read') && (
            <Link
              to="/invoices"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <Receipt className="w-5 h-5" />
              <span>Счета</span>
            </Link>
          )}
          {hasPermission('payments:read') && (
            <Link
              to="/payments"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <CreditCard className="w-5 h-5" />
              <span>Платежи</span>
            </Link>
          )}
          {hasPermission('suppliers:read') && (
            <Link
              to="/suppliers"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <Truck className="w-5 h-5" />
              <span>Поставщики</span>
            </Link>
          )}
          {hasPermission('stockMovements:read') && (
            <Link
              to="/stock"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <BarChart3 className="w-5 h-5" />
              <span>Остатки</span>
            </Link>
          )}
          {hasPermission('reports:read') && (
            <Link
              to="/reports"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <FileBarChart className="w-5 h-5" />
              <span>Отчёты</span>
            </Link>
          )}
          {hasPermission('audit:read') && (
            <Link
              to="/audit-logs"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <Shield className="w-5 h-5" />
              <span>Логи аудита</span>
            </Link>
          )}
          {hasPermission('users:read') && (
            <Link
              to="/users"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <UserCog className="w-5 h-5" />
              <span>Пользователи</span>
            </Link>
          )}
          {hasPermission('users:read') && (
            <Link
              to="/companies"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <Building2 className="w-5 h-5" />
              <span>Компании</span>
            </Link>
          )}
        </nav>
      </aside>

      {/* Main content */}
      <div className="ml-64">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="px-6 py-4 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                {user?.companyId ? `Компания: ${companyName}` : 'Выберите компанию'}
              </h2>
              {user?.roles && user.roles.length > 0 && (
                <p className="text-sm text-gray-500">
                  Роли: {user.roles.map(role => roleLabels[role] || role).join(', ')}
                </p>
              )}
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{user?.email}</span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Выход
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

