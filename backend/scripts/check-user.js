// Скрипт для проверки пользователя в БД
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function checkUser() {
  try {
    const email = 'admin@example.com';
    const password = 'password123';

    console.log('🔍 Проверка пользователя...\n');

    // Поиск пользователя
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.log('❌ Пользователь не найден!');
      console.log('💡 Запустите: npm run prisma:seed');
      return;
    }

    console.log('✅ Пользователь найден:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Имя: ${user.firstName} ${user.lastName}`);
    console.log(`   Активен: ${user.isActive}`);
    console.log(`   Создан: ${user.createdAt}\n`);

    // Проверка пароля
    console.log('🔐 Проверка пароля...');
    const isValid = await bcrypt.compare(password, user.passwordHash);
    
    if (isValid) {
      console.log('✅ Пароль правильный!');
    } else {
      console.log('❌ Пароль неверный!');
      console.log('💡 Попробуйте пересоздать пользователя:');
      console.log('   1. Удалите пользователя из БД');
      console.log('   2. Запустите: npm run prisma:seed');
    }

    // Проверка ролей
    const roles = await prisma.userCompanyRole.findMany({
      where: { userId: user.id },
      include: { role: true, company: true },
    });

    if (roles.length > 0) {
      console.log('\n👤 Роли пользователя:');
      roles.forEach((ur) => {
        console.log(`   - ${ur.role.name} в компании "${ur.company.name}"`);
      });
    } else {
      console.log('\n⚠️  У пользователя нет ролей!');
    }

  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkUser();

