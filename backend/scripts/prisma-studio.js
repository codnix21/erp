require('dotenv').config();

// Проверяем наличие DATABASE_URL
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set!');
  console.error('Please check your .env file');
  process.exit(1);
}

// Убираем параметр schema=public из URL, так как он вызывает ошибку в Prisma Studio
// Prisma Studio использует схему из schema.prisma
let databaseUrl = process.env.DATABASE_URL;
if (databaseUrl.includes('?schema=')) {
  databaseUrl = databaseUrl.split('?')[0];
}

// Порт для Prisma Studio (по умолчанию 5555, но можно указать другой)
const port = process.env.PRISMA_STUDIO_PORT || '5555';

console.log('🚀 Starting Prisma Studio...');
console.log(`📊 Database: ${databaseUrl.replace(/:[^:@]+@/, ':****@')}`);
console.log(`🌐 Port: ${port}`);
console.log(`💡 If you see "EADDRINUSE" error:`);
console.log(`   1. Close the previous Prisma Studio instance`);
console.log(`   2. Or set PRISMA_STUDIO_PORT environment variable to use a different port`);
console.log(`   3. Or kill the process: taskkill /F /PID <PID>`);

// Запускаем Prisma Studio с явной передачей URL через флаг --url и порта
const { spawn } = require('child_process');
const prismaStudio = spawn('npx', ['prisma', 'studio', '--url', databaseUrl, '--port', port], {
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    DATABASE_URL: databaseUrl,
  },
});

prismaStudio.on('error', (error) => {
  console.error('❌ Error starting Prisma Studio:', error);
  process.exit(1);
});

prismaStudio.on('exit', (code) => {
  process.exit(code || 0);
});

