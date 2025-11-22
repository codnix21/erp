import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { usePermissions } from '../hooks/usePermissions';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: string;
  requiredRole?: string;
  requiredAnyRole?: string[];
}

export default function ProtectedRoute({
  children,
  requiredPermission,
  requiredRole,
  requiredAnyRole,
}: ProtectedRouteProps) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { hasPermission, hasRole, hasAnyRole } = usePermissions();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Доступ запрещён</h1>
          <p className="text-gray-600">У вас нет прав для доступа к этой странице</p>
        </div>
      </div>
    );
  }

  if (requiredRole && !hasRole(requiredRole)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Доступ запрещён</h1>
          <p className="text-gray-600">Требуется роль: {requiredRole}</p>
        </div>
      </div>
    );
  }

  if (requiredAnyRole && !hasAnyRole(...requiredAnyRole)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Доступ запрещён</h1>
          <p className="text-gray-600">
            Требуется одна из ролей: {requiredAnyRole.join(', ')}
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

