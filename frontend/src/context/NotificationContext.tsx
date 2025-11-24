import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { setNotificationHandler } from '../utils/notifications';

interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

interface NotificationContextType {
  notifications: Notification[];
  show: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
  remove: (id: string) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const show = useCallback(
    (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
      const id = Math.random().toString(36).substring(7);
      setNotifications((prev) => [...prev, { id, message, type }]);
      return id;
    },
    []
  );

  const remove = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const success = useCallback((message: string) => show(message, 'success'), [show]);
  const error = useCallback((message: string) => show(message, 'error'), [show]);
  const warning = useCallback((message: string) => show(message, 'warning'), [show]);
  const info = useCallback((message: string) => show(message, 'info'), [show]);

  // Регистрируем обработчики для использования вне React компонентов
  useEffect(() => {
    setNotificationHandler({ error, success, warning, info });
    return () => {
      setNotificationHandler(null);
    };
  }, [error, success, warning, info]);

  return (
    <NotificationContext.Provider
      value={{ notifications, show, remove, success, error, warning, info }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
}

