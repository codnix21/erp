import { useAuthStore } from '../store/authStore';

// Маппинг ролей на разрешения
const rolePermissions: Record<string, string[]> = {
  Admin: [
    'users:create',
    'users:read',
    'users:update',
    'users:delete',
    'products:create',
    'products:read',
    'products:update',
    'products:delete',
    'orders:create',
    'orders:read',
    'orders:update',
    'orders:delete',
    'customers:create',
    'customers:read',
    'customers:update',
    'customers:delete',
    'suppliers:create',
    'suppliers:read',
    'suppliers:update',
    'suppliers:delete',
    'warehouses:create',
    'warehouses:read',
    'warehouses:update',
    'warehouses:delete',
    'invoices:create',
    'invoices:read',
    'invoices:update',
    'invoices:delete',
    'payments:create',
    'payments:read',
    'payments:update',
    'payments:delete',
    'stockMovements:create',
    'stockMovements:read',
    'reports:read',
    'audit:read',
  ],
  Manager: [
    'products:create',
    'products:read',
    'products:update',
    'orders:create',
    'orders:read',
    'orders:update',
    'customers:create',
    'customers:read',
    'customers:update',
    'suppliers:create',
    'suppliers:read',
    'suppliers:update',
    'reports:read',
  ],
  Accountant: [
    'invoices:create',
    'invoices:read',
    'invoices:update',
    'payments:create',
    'payments:read',
    'payments:update',
    'reports:read',
    'orders:read',
  ],
  Warehouse: [
    'warehouses:read',
    'warehouses:update',
    'products:read',
    'orders:read',
    'stockMovements:create',
    'stockMovements:read',
  ],
};

export function usePermissions() {
  const user = useAuthStore((state) => state.user);
  const roles = user?.roles || [];

  // Собираем все разрешения из ролей пользователя
  const permissions = new Set<string>();
  roles.forEach((role) => {
    const rolePerms = rolePermissions[role] || [];
    rolePerms.forEach((perm) => permissions.add(perm));
  });

  const hasPermission = (permission: string): boolean => {
    // Admin имеет все права
    if (roles.includes('Admin')) {
      return true;
    }
    return permissions.has(permission);
  };

  const hasRole = (role: string): boolean => {
    return roles.includes(role);
  };

  const hasAnyRole = (...checkRoles: string[]): boolean => {
    return checkRoles.some((role) => roles.includes(role));
  };

  return {
    permissions: Array.from(permissions),
    roles,
    hasPermission,
    hasRole,
    hasAnyRole,
    isAdmin: roles.includes('Admin'),
  };
}

