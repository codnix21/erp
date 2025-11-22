import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import OrdersPage from './pages/OrdersPage';
import OrderDetailPage from './pages/OrderDetailPage';
import ProductsPage from './pages/ProductsPage';
import CustomersPage from './pages/CustomersPage';
import WarehousesPage from './pages/WarehousesPage';
import InvoicesPage from './pages/InvoicesPage';
import ProductFormPage from './pages/ProductFormPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CustomerFormPage from './pages/CustomerFormPage';
import CustomerDetailPage from './pages/CustomerDetailPage';
import OrderFormPage from './pages/OrderFormPage';
import InvoiceDetailPage from './pages/InvoiceDetailPage';
import WarehouseDetailPage from './pages/WarehouseDetailPage';
import WarehouseFormPage from './pages/WarehouseFormPage';
import StockPage from './pages/StockPage';
import InvoiceFormPage from './pages/InvoiceFormPage';
import PaymentFormPage from './pages/PaymentFormPage';
import PaymentsPage from './pages/PaymentsPage';
import StockMovementFormPage from './pages/StockMovementFormPage';
import ReportsPage from './pages/ReportsPage';
import AuditLogsPage from './pages/AuditLogsPage';
import SuppliersPage from './pages/SuppliersPage';
import SupplierFormPage from './pages/SupplierFormPage';
import SupplierDetailPage from './pages/SupplierDetailPage';
import UsersPage from './pages/UsersPage';
import UserFormPage from './pages/UserFormPage';
import UserDetailPage from './pages/UserDetailPage';
import CompaniesPage from './pages/CompaniesPage';
import CompanyFormPage from './pages/CompanyFormPage';
import CompanyDetailPage from './pages/CompanyDetailPage';
import Layout from './components/Layout';
import NotificationContainer from './components/NotificationContainer';
import ProtectedRoute from './components/ProtectedRoute';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <NotificationContainer />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="orders" element={<ProtectedRoute requiredPermission="orders:read"><OrdersPage /></ProtectedRoute>} />
          <Route path="orders/new" element={<ProtectedRoute requiredPermission="orders:create"><OrderFormPage /></ProtectedRoute>} />
          <Route path="orders/:id" element={<ProtectedRoute requiredPermission="orders:read"><OrderDetailPage /></ProtectedRoute>} />
          <Route path="orders/:id/edit" element={<ProtectedRoute requiredPermission="orders:update"><OrderFormPage /></ProtectedRoute>} />
          <Route path="products" element={<ProtectedRoute requiredPermission="products:read"><ProductsPage /></ProtectedRoute>} />
          <Route path="products/new" element={<ProtectedRoute requiredPermission="products:create"><ProductFormPage /></ProtectedRoute>} />
          <Route path="products/:id" element={<ProtectedRoute requiredPermission="products:read"><ProductDetailPage /></ProtectedRoute>} />
          <Route path="products/:id/edit" element={<ProtectedRoute requiredPermission="products:update"><ProductFormPage /></ProtectedRoute>} />
          <Route path="customers" element={<ProtectedRoute requiredPermission="customers:read"><CustomersPage /></ProtectedRoute>} />
          <Route path="customers/new" element={<ProtectedRoute requiredPermission="customers:create"><CustomerFormPage /></ProtectedRoute>} />
          <Route path="customers/:id" element={<ProtectedRoute requiredPermission="customers:read"><CustomerDetailPage /></ProtectedRoute>} />
          <Route path="customers/:id/edit" element={<ProtectedRoute requiredPermission="customers:update"><CustomerFormPage /></ProtectedRoute>} />
          <Route path="warehouses" element={<ProtectedRoute requiredPermission="warehouses:read"><WarehousesPage /></ProtectedRoute>} />
          <Route path="warehouses/new" element={<ProtectedRoute requiredPermission="warehouses:create"><WarehouseFormPage /></ProtectedRoute>} />
          <Route path="warehouses/:id" element={<ProtectedRoute requiredPermission="warehouses:read"><WarehouseDetailPage /></ProtectedRoute>} />
          <Route path="warehouses/:id/edit" element={<ProtectedRoute requiredPermission="warehouses:update"><WarehouseFormPage /></ProtectedRoute>} />
          <Route path="stock" element={<ProtectedRoute requiredPermission="stockMovements:read"><StockPage /></ProtectedRoute>} />
          <Route path="stock-movements/new" element={<ProtectedRoute requiredPermission="stockMovements:create"><StockMovementFormPage /></ProtectedRoute>} />
          <Route path="invoices" element={<ProtectedRoute requiredPermission="invoices:read"><InvoicesPage /></ProtectedRoute>} />
          <Route path="invoices/new" element={<ProtectedRoute requiredPermission="invoices:create"><InvoiceFormPage /></ProtectedRoute>} />
          <Route path="invoices/:id" element={<ProtectedRoute requiredPermission="invoices:read"><InvoiceDetailPage /></ProtectedRoute>} />
          <Route path="invoices/:id/edit" element={<ProtectedRoute requiredPermission="invoices:update"><InvoiceFormPage /></ProtectedRoute>} />
          <Route path="payments" element={<ProtectedRoute requiredPermission="payments:read"><PaymentsPage /></ProtectedRoute>} />
          <Route path="payments/new" element={<ProtectedRoute requiredPermission="payments:create"><PaymentFormPage /></ProtectedRoute>} />
          <Route path="payments/:id/edit" element={<ProtectedRoute requiredPermission="payments:update"><PaymentFormPage /></ProtectedRoute>} />
          <Route path="suppliers" element={<ProtectedRoute requiredPermission="suppliers:read"><SuppliersPage /></ProtectedRoute>} />
          <Route path="suppliers/new" element={<ProtectedRoute requiredPermission="suppliers:create"><SupplierFormPage /></ProtectedRoute>} />
          <Route path="suppliers/:id" element={<ProtectedRoute requiredPermission="suppliers:read"><SupplierDetailPage /></ProtectedRoute>} />
          <Route path="suppliers/:id/edit" element={<ProtectedRoute requiredPermission="suppliers:update"><SupplierFormPage /></ProtectedRoute>} />
          <Route path="reports" element={<ProtectedRoute requiredPermission="reports:read"><ReportsPage /></ProtectedRoute>} />
          <Route path="audit-logs" element={<ProtectedRoute requiredPermission="audit:read"><AuditLogsPage /></ProtectedRoute>} />
          <Route path="users" element={<ProtectedRoute requiredPermission="users:read"><UsersPage /></ProtectedRoute>} />
          <Route path="users/new" element={<ProtectedRoute requiredPermission="users:create"><UserFormPage /></ProtectedRoute>} />
          <Route path="users/:id" element={<ProtectedRoute requiredPermission="users:read"><UserDetailPage /></ProtectedRoute>} />
          <Route path="users/:id/edit" element={<ProtectedRoute requiredPermission="users:update"><UserFormPage /></ProtectedRoute>} />
          <Route path="companies" element={<ProtectedRoute requiredPermission="users:read"><CompaniesPage /></ProtectedRoute>} />
          <Route path="companies/new" element={<ProtectedRoute requiredPermission="users:create"><CompanyFormPage /></ProtectedRoute>} />
          <Route path="companies/:id" element={<ProtectedRoute requiredPermission="users:read"><CompanyDetailPage /></ProtectedRoute>} />
          <Route path="companies/:id/edit" element={<ProtectedRoute requiredPermission="users:update"><CompanyFormPage /></ProtectedRoute>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

