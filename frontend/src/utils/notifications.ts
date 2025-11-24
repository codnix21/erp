// Глобальный объект для показа уведомлений вне React компонентов
let notificationHandler: {
  error: (message: string) => void;
  success: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
} | null = null;

export const setNotificationHandler = (handler: typeof notificationHandler) => {
  notificationHandler = handler;
};

export const showError = (message: string) => {
  if (notificationHandler) {
    notificationHandler.error(message);
  }
};

export const showSuccess = (message: string) => {
  if (notificationHandler) {
    notificationHandler.success(message);
  }
};

export const showWarning = (message: string) => {
  if (notificationHandler) {
    notificationHandler.warning(message);
  }
};

export const showInfo = (message: string) => {
  if (notificationHandler) {
    notificationHandler.info(message);
  }
};

