# Архитектура ERP-системы

## Обзор системы

Универсальная ERP-система для малого и среднего бизнеса с поддержкой мультитенантности, построенная на современном стеке технологий.

## Технологический стек

### Frontend
- **React 18** + **TypeScript** - UI библиотека
- **Tailwind CSS** - стилизация
- **React Query** - управление состоянием сервера
- **Zustand** - клиентское состояние
- **React Router** - маршрутизация
- **Zod** - валидация форм
- **Axios** - HTTP клиент

### Backend
- **Node.js** + **TypeScript**
- **Fastify** - веб-фреймворк
- **Prisma** - ORM
- **PostgreSQL** - база данных
- **JWT** - авторизация
- **Zod** - валидация
- **Winston** - логирование

### Инфраструктура
- **Docker** + **Docker Compose** - контейнеризация
- **GitHub Actions** - CI/CD
- **Nginx** - reverse proxy (production)

## Архитектурные принципы

### 1. Мультитенантность (Multi-tenancy)
- Каждая компания изолирована на уровне БД
- Все запросы фильтруются по `company_id`
- Поддержка нескольких компаний в одном аккаунте пользователя

### 2. Безопасность
- JWT токены с refresh механизмом
- RBAC (Role-Based Access Control)
- Аудит всех действий пользователей
- Валидация на уровне API и БД
- Rate limiting

### 3. Масштабируемость
- Модульная архитектура
- Микросервисная готовность
- Кэширование (Redis - опционально)
- Асинхронная обработка задач (BullMQ - опционально)

### 4. Производительность
- Индексы БД для частых запросов
- Пагинация всех списков
- Lazy loading компонентов
- Оптимизация запросов (N+1 проблема)

## Структура проекта

```
erp/
├── backend/                 # Backend приложение
│   ├── src/
│   │   ├── config/         # Конфигурация
│   │   ├── controllers/    # Контроллеры
│   │   ├── services/       # Бизнес-логика
│   │   ├── models/         # Prisma модели
│   │   ├── middleware/     # Middleware
│   │   ├── routes/         # API маршруты
│   │   ├── utils/          # Утилиты
│   │   ├── types/          # TypeScript типы
│   │   └── app.ts          # Точка входа
│   ├── prisma/             # Prisma схема и миграции
│   ├── tests/              # Тесты
│   └── package.json
│
├── frontend/               # Frontend приложение
│   ├── src/
│   │   ├── components/    # React компоненты
│   │   ├── pages/         # Страницы
│   │   ├── hooks/         # Custom hooks
│   │   ├── store/         # Zustand store
│   │   ├── services/      # API сервисы
│   │   ├── utils/         # Утилиты
│   │   ├── types/         # TypeScript типы
│   │   └── App.tsx        # Точка входа
│   └── package.json
│
├── docker-compose.yml      # Docker конфигурация
├── .github/workflows/      # CI/CD
└── docs/                   # Документация
```

## Модули системы

### 1. Аутентификация и авторизация
- Регистрация/вход
- JWT + Refresh tokens
- Восстановление пароля
- Управление сессиями

### 2. Управление пользователями и ролями (RBAC)
- Пользователи
- Роли (Admin, Manager, Accountant, Warehouse)
- Разрешения (Permissions)
- Привязка пользователей к компаниям

### 3. Компании (Multi-tenant)
- Создание/редактирование компаний
- Переключение между компаниями
- Настройки компании
- Валюты и налоги

### 4. Клиенты и поставщики
- CRM функционал
- История взаимодействий
- Контакты и адреса
- Финансовая история

### 5. Товары и услуги
- Каталог товаров
- Категории и теги
- Единицы измерения
- Ценообразование
- Мультивалютность

### 6. Складской учёт
- Склады
- Остатки товаров
- Движение товаров (приход/расход)
- Инвентаризация
- Резервирование

### 7. Заказы и договоры
- Создание заказов
- Статусы заказов
- Связь с клиентами/поставщиками
- История изменений

### 8. Финансовые операции
- Счета (Invoices)
- Акты выполненных работ
- Платежи
- Дебиторская/кредиторская задолженность
- НДС и налоги

### 9. Отчёты и аналитика
- Финансовые отчёты
- Отчёты по продажам
- Отчёты по складу
- Настраиваемые отчёты
- Экспорт в PDF/Excel

### 10. Уведомления
- Системные уведомления
- Email уведомления
- Push уведомления (опционально)

### 11. Логи и аудит
- История изменений данных
- Логи действий пользователей
- Экспорт логов

## Схема базы данных

### Основные сущности

```
users
├── id (UUID)
├── email
├── password_hash
├── first_name
├── last_name
├── is_active
├── created_at
└── updated_at

roles
├── id (UUID)
├── name (Admin, Manager, Accountant, Warehouse)
├── permissions (JSON)
└── description

user_company_roles
├── id (UUID)
├── user_id → users
├── company_id → companies
├── role_id → roles
└── is_active

companies
├── id (UUID)
├── name
├── inn
├── address
├── default_currency
├── tax_rate
└── settings (JSON)

products
├── id (UUID)
├── company_id → companies
├── name
├── sku
├── category_id
├── unit
├── price
├── currency
├── tax_rate
└── is_service

customers
├── id (UUID)
├── company_id → companies
├── name
├── email
├── phone
├── address
└── tax_id

suppliers
├── id (UUID)
├── company_id → companies
├── name
├── email
├── phone
├── address
└── tax_id

orders
├── id (UUID)
├── company_id → companies
├── customer_id → customers
├── supplier_id → suppliers
├── order_number
├── status
├── total_amount
├── currency
├── created_by → users
└── due_date

order_items
├── id (UUID)
├── order_id → orders
├── product_id → products
├── quantity
├── price
├── tax_rate
└── total

invoices
├── id (UUID)
├── company_id → companies
├── order_id → orders
├── invoice_number
├── status
├── total_amount
├── paid_amount
├── currency
└── due_date

payments
├── id (UUID)
├── company_id → companies
├── invoice_id → invoices
├── amount
├── currency
├── payment_method
├── payment_date
└── created_by → users

warehouses
├── id (UUID)
├── company_id → companies
├── name
├── address
└── is_active

stock_movements
├── id (UUID)
├── company_id → companies
├── warehouse_id → warehouses
├── product_id → products
├── movement_type (IN, OUT, TRANSFER, ADJUSTMENT)
├── quantity
├── reference_id (order_id, etc.)
└── created_by → users

audit_logs
├── id (UUID)
├── company_id → companies
├── user_id → users
├── action (CREATE, UPDATE, DELETE)
├── entity_type
├── entity_id
├── old_values (JSON)
├── new_values (JSON)
└── created_at
```

## API Архитектура

### RESTful принципы
- `/api/v1/` - префикс версии
- Ресурсы в множественном числе
- HTTP методы: GET, POST, PUT, PATCH, DELETE
- Стандартные коды ответов



## Безопасность

### 1. Аутентификация
- JWT токены (access: 15 мин, refresh: 7 дней)
- Хеширование паролей (bcrypt)
- Rate limiting на эндпоинты входа

### 2. Авторизация
- Проверка ролей на уровне middleware
- Фильтрация по company_id на уровне БД
- Валидация прав доступа к ресурсам

### 3. Защита данных
- SQL injection защита (Prisma)
- XSS защита (валидация входных данных)
- CSRF токены
- HTTPS обязателен в production

### 4. Аудит
- Логирование всех критических действий
- История изменений данных
- Отслеживание IP адресов

## Масштабирование

### Горизонтальное масштабирование
- Stateless backend (JWT токены)
- Load balancer для распределения нагрузки
- Репликация БД (read replicas)

### Вертикальное масштабирование
- Оптимизация запросов
- Индексы БД
- Кэширование (Redis)

### Микросервисная готовность
- Модульная архитектура
- Чёткие границы модулей
- Возможность выделения в отдельные сервисы

## Мониторинг и логирование

### Логирование
- Winston для структурированных логов
- Уровни: error, warn, info, debug
- Ротация логов
- Централизованное хранение (опционально)

### Мониторинг
- Health check эндпоинты
- Метрики производительности
- Алерты на ошибки
- Дашборды (Grafana - опционально)

## Деплой

### Docker
- Multi-stage builds
- Оптимизация размера образов
- Docker Compose для разработки

### CI/CD
- Автоматические тесты
- Линтинг и форматирование
- Автоматический деплой
- Rollback стратегия

## Монетизация (SaaS модель)

### Тарифные планы
1. **Starter** - до 3 компаний, 1000 товаров
2. **Business** - до 10 компаний, 10000 товаров
3. **Enterprise** - неограниченно, кастомные интеграции

### Метрики
- Количество компаний
- Количество пользователей
- Объём данных
- API запросы

