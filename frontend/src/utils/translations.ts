// Утилита для перевода сообщений об ошибках и статусов на русский

export const translateError = (error: string): string => {
  const errorTranslations: Record<string, string> = {
    // Общие ошибки
    'Failed to fetch': 'Ошибка загрузки данных',
    'Network Error': 'Ошибка сети',
    'Request failed': 'Ошибка запроса',
    'Unauthorized': 'Не авторизован',
    'Forbidden': 'Доступ запрещён',
    'Not Found': 'Не найдено',
    'Internal Server Error': 'Внутренняя ошибка сервера',
    'Bad Request': 'Неверный запрос',
    
    // Ошибки пользователей
    'User not found': 'Пользователь не найден',
    'User with this email already exists': 'Пользователь с таким email уже существует',
    'Failed to create user': 'Ошибка создания пользователя',
    'Failed to update user': 'Ошибка обновления пользователя',
    'Failed to delete user': 'Ошибка удаления пользователя',
    'Failed to assign role': 'Ошибка назначения роли',
    'Failed to remove role': 'Ошибка удаления роли',
    
    // Ошибки компаний
    'Company not found': 'Компания не найдена',
    'Company with this INN already exists': 'Компания с таким ИНН уже существует',
    'Failed to create company': 'Ошибка создания компании',
    'Failed to update company': 'Ошибка обновления компании',
    'Failed to delete company': 'Ошибка удаления компании',
    'Cannot delete company with existing data': 'Невозможно удалить компанию с существующими данными',
    
    // Ошибки заказов
    'Order not found': 'Заказ не найден',
    'Failed to create order': 'Ошибка создания заказа',
    'Failed to update order': 'Ошибка обновления заказа',
    'Failed to delete order': 'Ошибка удаления заказа',
    
    // Ошибки счетов
    'Invoice not found': 'Счёт не найден',
    'Failed to create invoice': 'Ошибка создания счёта',
    'Failed to update invoice': 'Ошибка обновления счёта',
    'Failed to delete invoice': 'Ошибка удаления счёта',
    
    // Ошибки товаров
    'Product not found': 'Товар не найден',
    'Failed to create product': 'Ошибка создания товара',
    'Failed to update product': 'Ошибка обновления товара',
    'Failed to delete product': 'Ошибка удаления товара',
    
    // Ошибки клиентов
    'Customer not found': 'Клиент не найден',
    'Failed to create customer': 'Ошибка создания клиента',
    'Failed to update customer': 'Ошибка обновления клиента',
    'Failed to delete customer': 'Ошибка удаления клиента',
    
    // Ошибки экспорта
    'Failed to export': 'Ошибка экспорта',
    'Export error': 'Ошибка экспорта',
    'Failed to export PDF': 'Ошибка экспорта PDF',
    'Print error': 'Ошибка печати',
    
    // Ошибки валидации
    'Invalid email': 'Неверный email',
    'Password must be at least 6 characters': 'Пароль должен быть не менее 6 символов',
    'Required field': 'Обязательное поле',
    'Invalid UUID': 'Неверный идентификатор',
  };

  // Ищем точное совпадение
  if (errorTranslations[error]) {
    return errorTranslations[error];
  }

  // Ищем частичное совпадение (case-insensitive)
  const lowerError = error.toLowerCase();
  for (const [key, value] of Object.entries(errorTranslations)) {
    if (lowerError.includes(key.toLowerCase())) {
      return value;
    }
  }

  // Если не нашли перевод, возвращаем оригинал
  return error;
};

// Перевод статусов заказов
export const translateOrderStatus = (status: string): string => {
  const statusLabels: Record<string, string> = {
    DRAFT: 'Черновик',
    PENDING: 'Ожидает',
    CONFIRMED: 'Подтверждён',
    IN_PROGRESS: 'В работе',
    COMPLETED: 'Завершён',
    CANCELLED: 'Отменён',
  };
  return statusLabels[status] || status;
};

// Перевод статусов счетов
export const translateInvoiceStatus = (status: string): string => {
  const statusLabels: Record<string, string> = {
    DRAFT: 'Черновик',
    ISSUED: 'Выставлен',
    PAID: 'Оплачен',
    PARTIALLY_PAID: 'Частично оплачен',
    OVERDUE: 'Просрочен',
    CANCELLED: 'Отменён',
  };
  return statusLabels[status] || status;
};

