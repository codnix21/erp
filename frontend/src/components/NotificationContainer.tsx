import Notification from './Notification';
import { useNotifications } from '../context/NotificationContext';

export default function NotificationContainer() {
  const { notifications, remove } = useNotifications();

  return (
    <>
      {notifications.map((notification) => (
        <Notification
          key={notification.id}
          message={notification.message}
          type={notification.type}
          onClose={() => remove(notification.id)}
        />
      ))}
    </>
  );
}

