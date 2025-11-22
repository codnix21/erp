# Multi-stage build для оптимизации размера образа

# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

# Копируем файлы зависимостей
COPY package*.json ./
COPY prisma ./prisma/

# Устанавливаем зависимости
RUN npm ci

# Копируем исходный код
COPY . .

# Генерируем Prisma Client
RUN npx prisma generate

# Собираем проект
RUN npm run build

# Stage 2: Production
FROM node:18-alpine AS production

WORKDIR /app

# Устанавливаем только production зависимости
COPY package*.json ./
RUN npm ci --only=production

# Копируем собранные файлы
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Создаём пользователя без root прав
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

USER nodejs

EXPOSE 3000

CMD ["node", "dist/app.js"]

