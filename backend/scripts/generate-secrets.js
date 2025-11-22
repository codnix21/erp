// Скрипт для генерации JWT секретов
const crypto = require('crypto');

function generateSecret() {
  return crypto.randomBytes(32).toString('base64');
}

console.log('Сгенерированные секреты для .env файла:\n');
console.log(`JWT_SECRET="${generateSecret()}"`);
console.log(`JWT_REFRESH_SECRET="${generateSecret()}"`);
console.log('\nСкопируйте эти значения в ваш .env файл!');

