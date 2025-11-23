import { useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { usePermissions } from '../hooks/usePermissions';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { LogOut, Package, Home, FileText, Users, Warehouse, Receipt, CreditCard, Truck, BarChart3, FileBarChart, Shield, UserCog, Building2, FolderTree, Menu, X } from 'lucide-react';

const roleLabels: Record<string, string> = {
  Admin: 'Администратор',
  Manager: 'Менеджер',
  Accountant: 'Бухгалтер',
  Warehouse: 'Складской',
};

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
      {/* Mobile menu overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full w-64 bg-white shadow-lg z-50 transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <div className="flex items-center justify-between p-4 lg:p-6 border-b">
          <h1 className="text-xl lg:text-2xl font-bold text-primary-600">ERP System</h1>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="px-4 py-2 overflow-y-auto h-[calc(100vh-80px)]">
          <Link
            to="/"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors text-sm"
          >
            <Home className="w-5 h-5 flex-shrink-0" />
            <span>Главная</span>
          </Link>
          {hasPermission('orders:read') && (
            <Link
              to="/orders"
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors text-sm"
            >
              <FileText className="w-5 h-5 flex-shrink-0" />
              <span>Заказы</span>
            </Link>
          )}
          {hasPermission('products:read') && (
            <Link
              to="/products"
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors text-sm"
            >
              <Package className="w-5 h-5 flex-shrink-0" />
              <span>Товары</span>
            </Link>
          )}
          {hasPermission('products:read') && (
            <Link
              to="/categories"
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors text-sm"
            >
              <FolderTree className="w-5 h-5 flex-shrink-0" />
              <span>Категории</span>
            </Link>
          )}
          {hasPermission('customers:read') && (
            <Link
              to="/customers"
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors text-sm"
            >
              <Users className="w-5 h-5 flex-shrink-0" />
              <span>Клиенты</span>
            </Link>
          )}
          {hasPermission('warehouses:read') && (
            <Link
              to="/warehouses"
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors text-sm"
            >
              <Warehouse className="w-5 h-5 flex-shrink-0" />
              <span>Склады</span>
            </Link>
          )}
          {hasPermission('invoices:read') && (
            <Link
              to="/invoices"
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors text-sm"
            >
              <Receipt className="w-5 h-5 flex-shrink-0" />
              <span>Счета</span>
            </Link>
          )}
          {hasPermission('payments:read') && (
            <Link
              to="/payments"
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors text-sm"
            >
              <CreditCard className="w-5 h-5 flex-shrink-0" />
              <span>Платежи</span>
            </Link>
          )}
          {hasPermission('suppliers:read') && (
            <Link
              to="/suppliers"
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors text-sm"
            >
              <Truck className="w-5 h-5 flex-shrink-0" />
              <span>Поставщики</span>
            </Link>
          )}
          {hasPermission('stockMovements:read') && (
            <Link
              to="/stock"
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors text-sm"
            >
              <BarChart3 className="w-5 h-5 flex-shrink-0" />
              <span>Остатки</span>
            </Link>
          )}
          {hasPermission('stockMovements:read') && (
            <Link
              to="/stock-movements"
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors text-sm"
            >
              <Package className="w-5 h-5 flex-shrink-0" />
              <span>Движения товаров</span>
            </Link>
          )}
          {hasPermission('reports:read') && (
            <Link
              to="/reports"
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors text-sm"
            >
              <FileBarChart className="w-5 h-5 flex-shrink-0" />
              <span>Отчёты</span>
            </Link>
          )}
          {hasPermission('audit:read') && (
            <Link
              to="/audit-logs"
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors text-sm"
            >
              <Shield className="w-5 h-5 flex-shrink-0" />
              <span>Логи аудита</span>
            </Link>
          )}
          {hasPermission('users:read') && (
            <Link
              to="/users"
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors text-sm"
            >
              <UserCog className="w-5 h-5 flex-shrink-0" />
              <span>Пользователи</span>
            </Link>
          )}
          {hasPermission('users:read') && (
            <Link
              to="/companies"
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors text-sm"
            >
              <Building2 className="w-5 h-5 flex-shrink-0" />
              <span>Компании</span>
            </Link>
          )}
        </nav>
      </aside>

      {/* Main content */}
      <div className="lg:ml-64">
        {/* Header */}
        <header className="bg-white shadow-sm border-b sticky top-0 z-30">
          <div className="px-4 lg:px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="min-w-0 flex-1">
                <h2 className="text-base lg:text-lg font-semibold text-gray-800 truncate">
                  {user?.companyId ? `Компания: ${companyName}` : 'Выберите компанию'}
                </h2>
                {user?.roles && user.roles.length > 0 && (
                  <p className="text-xs lg:text-sm text-gray-500 truncate">
                    Роли: {user.roles.map(role => roleLabels[role] || role).join(', ')}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 lg:gap-4 flex-shrink-0">
              <span className="text-xs lg:text-sm text-gray-600 hidden sm:inline truncate max-w-[150px] lg:max-w-none">
                {user?.email}
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 lg:gap-2 px-2 lg:px-4 py-2 text-xs lg:text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title="Выход"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden lg:inline">Выход</span>
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

