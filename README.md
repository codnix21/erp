# ERP System - Универсальная корпоративная ERP-система

## 🏗️ Архитектура системы

### Технологический стек

- **Frontend**: React 18 + TypeScript + Tailwind CSS + Vite
- **Backend**: Node.js + TypeScript + Fastify
- **База данных**: PostgreSQL 15+
- **ORM**: Prisma
- **Аутентификация**: JWT + Refresh Tokens
- **Валидация**: Zod
- **Контейнеризация**: Docker + Docker Compose

### Структура проекта

```
erp/
├── backend/                 # Backend приложение
│   ├── src/
│   │   ├── config/         # Конфигурация
│   │   ├── controllers/    # Контроллеры
│   │   ├── services/       # Бизнес-логика
│   │   ├── middleware/     # Middleware
│   │   ├── routes/         # Маршруты API
│   │   ├── models/         # Prisma модели
│   │   ├── utils/          # Утилиты
│   │   ├── validators/     # Zod схемы
│   │   └── types/          # TypeScript типы
│   ├── prisma/             # Prisma схемы и миграции
│   └── tests/              # Тесты
│
├── frontend/               # Frontend приложение
│   ├── src/
│   │   ├── components/     # React компоненты
│   │   ├── pages/          # Страницы
│   │   ├── hooks/          # Custom hooks
│   │   ├── store/          # State management
│   │   ├── services/       # API клиенты
│   │   ├── utils/          # Утилиты
│   │   └── types/          # TypeScript типы
│   └── public/
│
├── docs/                   # Документация
├── docker-compose.yml      # Docker конфигурация
└── README.md
```

## 🚀 Быстрый старт

### Требования

- Node.js 18+
- PostgreSQL 15+
- Docker (опционально)

### Установка

```bash
# Backend
cd backend
npm install
npx prisma migrate dev
npm run dev

# Frontend
cd frontend
npm install
npm run dev
```

### Docker

```bash
docker-compose up -d
```

## 📚 Документация

- **[Архитектура системы](./ARCHITECTURE.md)** - полное описание архитектуры

Подробная документация в папке `docs/`:

- [Монетизация SaaS](./docs/SAAS-MONETIZATION.md) - стратегия монетизации

## 🔐 Модули системы

1. **Пользователи и роли** (RBAC)
2. **Компании** (Multi-tenant)
3. **Клиенты и поставщики**
4. **Товары и услуги**
5. **Складской учёт**
6. **Заказы и договоры**
7. **Финансовые операции**
8. **Счета и акты**
9. **Платежи**
10. **Отчёты и аналитика**
11. **Уведомления**
12. **Логи и аудит**

## 📄 Лицензия
MIT

