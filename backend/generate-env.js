// Скрипт для генерации .env файла с секретами
const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

function generateSecret() {
  return crypto.randomBytes(32).toString('base64');
}

// Чтение пароля из аргументов или запрос
const dbPassword = process.argv[2] || 'password';

const envContent = `# Database
# ВАЖНО: Замените '${dbPassword}' на реальный пароль от базы данных!
DATABASE_URL="postgresql://Erp:${dbPassword}@codnix.ru:5432/ERP?schema=public"

# JWT - Автоматически сгенерированные секреты
JWT_SECRET="${generateSecret()}"
JWT_REFRESH_SECRET="${generateSecret()}"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# Server
PORT=3000
NODE_ENV=development
HOST=0.0.0.0

# CORS
CORS_ORIGIN="http://localhost:5173"

# Logging
LOG_LEVEL=info
`;

const envPath = path.join(__dirname, '.env');

if (fs.existsSync(envPath)) {
  console.log('⚠️  Файл .env уже существует!');
  console.log('Хотите перезаписать? (y/n)');
  // Для автоматического создания без подтверждения, просто создаём файл
  console.log('Создаю .env файл...');
}

fs.writeFileSync(envPath, envContent, 'utf8');
console.log('✅ Файл .env успешно создан!');
console.log(`📝 DATABASE_URL использует пароль: ${dbPassword}`);
console.log('⚠️  Если пароль неверный, отредактируйте .env файл вручную');

