import { PrismaClient, Prisma } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

// Загружаем переменные окружения
dotenv.config();

const { Decimal } = Prisma;

// Проверяем наличие DATABASE_URL
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set!');
  console.error('Please create a .env file with DATABASE_URL');
  process.exit(1);
}

// Создаем Pool и адаптер для Prisma 7
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding database...');

  // Очистка существующих данных (опционально)
  console.log('🧹 Cleaning existing data...');
  await prisma.auditLog.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.warehouse.deleteMany();
  await prisma.userCompanyRole.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
  await prisma.company.deleteMany();
  await prisma.role.deleteMany();

  // Создание ролей
  const adminRole = await prisma.role.create({
    data: {
      name: 'Admin',
      description: 'Администратор системы',
      permissions: {
        users: ['create', 'read', 'update', 'delete'],
        companies: ['create', 'read', 'update', 'delete'],
        products: ['create', 'read', 'update', 'delete'],
        orders: ['create', 'read', 'update', 'delete'],
        invoices: ['create', 'read', 'update', 'delete'],
        payments: ['create', 'read', 'update', 'delete'],
        warehouses: ['create', 'read', 'update', 'delete'],
        reports: ['read'],
      },
    },
  });

  const managerRole = await prisma.role.create({
    data: {
      name: 'Manager',
      description: 'Менеджер',
      permissions: {
        products: ['create', 'read', 'update'],
        orders: ['create', 'read', 'update'],
        customers: ['create', 'read', 'update'],
        suppliers: ['create', 'read', 'update'],
        reports: ['read'],
      },
    },
  });

  const accountantRole = await prisma.role.create({
    data: {
      name: 'Accountant',
      description: 'Бухгалтер',
      permissions: {
        invoices: ['create', 'read', 'update'],
        payments: ['create', 'read', 'update'],
        reports: ['read'],
        orders: ['read'],
      },
    },
  });

  const warehouseRole = await prisma.role.create({
    data: {
      name: 'Warehouse',
      description: 'Складской работник',
      permissions: {
        warehouses: ['read', 'update'],
        products: ['read'],
        orders: ['read'],
        stockMovements: ['create', 'read'],
      },
    },
  });

  console.log('✅ Roles created');

  // Создание пользователей
  const passwordHash = await bcrypt.hash('password123', 10);
  
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      passwordHash,
      firstName: 'Иван',
      lastName: 'Петров',
      isActive: true,
    },
  });

  const managerUser = await prisma.user.create({
    data: {
      email: 'manager@example.com',
      passwordHash,
      firstName: 'Мария',
      lastName: 'Сидорова',
      isActive: true,
    },
  });

  const accountantUser = await prisma.user.create({
    data: {
      email: 'accountant@example.com',
      passwordHash,
      firstName: 'Анна',
      lastName: 'Иванова',
      isActive: true,
    },
  });

  console.log('✅ Users created');

  // Создание компании
  const testCompany = await prisma.company.create({
    data: {
      name: 'ООО ТехноПродакшн',
      inn: '1234567890',
      address: 'г. Москва, ул. Ленина, д. 10, офис 205',
      phone: '+7 495 123 45 67',
      email: 'info@techprod.ru',
      defaultCurrency: 'RUB',
      taxRate: 20,
      settings: {
        timezone: 'Europe/Moscow',
        dateFormat: 'DD.MM.YYYY',
      },
    },
  });

  console.log('✅ Company created');

  // Привязка пользователей к компании
  await prisma.userCompanyRole.createMany({
    data: [
      {
        userId: adminUser.id,
        companyId: testCompany.id,
        roleId: adminRole.id,
        isActive: true,
      },
      {
        userId: managerUser.id,
        companyId: testCompany.id,
        roleId: managerRole.id,
        isActive: true,
      },
      {
        userId: accountantUser.id,
        companyId: testCompany.id,
        roleId: accountantRole.id,
        isActive: true,
      },
    ],
  });

  console.log('✅ User-Company-Role relationships created');

  // Создание категорий
  const categories = await Promise.all([
    prisma.category.create({
      data: {
        companyId: testCompany.id,
        name: 'Электроника',
        description: 'Электронные товары и устройства',
      },
    }),
    prisma.category.create({
      data: {
        companyId: testCompany.id,
        name: 'Компьютеры',
        description: 'Компьютерная техника',
      },
    }),
    prisma.category.create({
      data: {
        companyId: testCompany.id,
        name: 'Периферия',
        description: 'Компьютерная периферия',
      },
    }),
    prisma.category.create({
      data: {
        companyId: testCompany.id,
        name: 'Услуги',
        description: 'IT услуги и консультации',
      },
    }),
  ]);

  console.log('✅ Categories created');

  // Создание товаров
  const products = await Promise.all([
    prisma.product.create({
      data: {
        companyId: testCompany.id,
        name: 'Ноутбук ASUS ROG',
        sku: 'LAPTOP-ASUS-001',
        description: 'Игровой ноутбук ASUS ROG Strix G15',
        categoryId: categories[1].id,
        unit: 'шт',
        price: 89900,
        currency: 'RUB',
        taxRate: 20,
        isService: false,
      },
    }),
    prisma.product.create({
      data: {
        companyId: testCompany.id,
        name: 'Мышь Logitech MX Master 3',
        sku: 'MOUSE-LOG-001',
        description: 'Беспроводная мышь Logitech MX Master 3',
        categoryId: categories[2].id,
        unit: 'шт',
        price: 8990,
        currency: 'RUB',
        taxRate: 20,
        isService: false,
      },
    }),
    prisma.product.create({
      data: {
        companyId: testCompany.id,
        name: 'Клавиатура Keychron K2',
        sku: 'KB-KEY-001',
        description: 'Механическая клавиатура Keychron K2',
        categoryId: categories[2].id,
        unit: 'шт',
        price: 12990,
        currency: 'RUB',
        taxRate: 20,
        isService: false,
      },
    }),
    prisma.product.create({
      data: {
        companyId: testCompany.id,
        name: 'Монитор Dell UltraSharp 27',
        sku: 'MON-DELL-001',
        description: 'Монитор Dell UltraSharp 27 дюймов 4K',
        categoryId: categories[0].id,
        unit: 'шт',
        price: 45900,
        currency: 'RUB',
        taxRate: 20,
        isService: false,
      },
    }),
    prisma.product.create({
      data: {
        companyId: testCompany.id,
        name: 'Веб-разработка',
        sku: 'SERVICE-WEB-001',
        description: 'Разработка веб-приложений',
        categoryId: categories[3].id,
        unit: 'час',
        price: 3500,
        currency: 'RUB',
        taxRate: 20,
        isService: true,
      },
    }),
    prisma.product.create({
      data: {
        companyId: testCompany.id,
        name: 'IT консультация',
        sku: 'SERVICE-CONS-001',
        description: 'Консультация по IT вопросам',
        categoryId: categories[3].id,
        unit: 'час',
        price: 2500,
        currency: 'RUB',
        taxRate: 20,
        isService: true,
      },
    }),
    prisma.product.create({
      data: {
        companyId: testCompany.id,
        name: 'Смартфон iPhone 15 Pro',
        sku: 'PHONE-IPHONE-001',
        description: 'Смартфон Apple iPhone 15 Pro 256GB',
        categoryId: categories[0].id,
        unit: 'шт',
        price: 129900,
        currency: 'RUB',
        taxRate: 20,
        isService: false,
      },
    }),
    prisma.product.create({
      data: {
        companyId: testCompany.id,
        name: 'Планшет iPad Air',
        sku: 'TABLET-IPAD-001',
        description: 'Планшет Apple iPad Air 11"',
        categoryId: categories[0].id,
        unit: 'шт',
        price: 69900,
        currency: 'RUB',
        taxRate: 20,
        isService: false,
      },
    }),
  ]);

  console.log('✅ Products created');

  // Создание клиентов
  const customers = await Promise.all([
    prisma.customer.create({
      data: {
        companyId: testCompany.id,
        name: 'ООО "Вектор"',
        email: 'info@vector.ru',
        phone: '+7 495 111 22 33',
        address: 'г. Москва, ул. Тверская, д. 5',
        taxId: '7701234567',
      },
    }),
    prisma.customer.create({
      data: {
        companyId: testCompany.id,
        name: 'ИП Сидоров Петр Иванович',
        email: 'sidorov@mail.ru',
        phone: '+7 916 123 45 67',
        address: 'г. Санкт-Петербург, пр. Невский, д. 28',
        taxId: '781234567890',
      },
    }),
    prisma.customer.create({
      data: {
        companyId: testCompany.id,
        name: 'ООО "ТехноСервис"',
        email: 'sales@technoservice.ru',
        phone: '+7 495 222 33 44',
        address: 'г. Москва, ул. Арбат, д. 15',
        taxId: '7702345678',
      },
    }),
    prisma.customer.create({
      data: {
        companyId: testCompany.id,
        name: 'ООО "Цифровые Решения"',
        email: 'contact@digital.ru',
        phone: '+7 812 333 44 55',
        address: 'г. Санкт-Петербург, ул. Литейный, д. 42',
        taxId: '7813456789',
      },
    }),
  ]);

  console.log('✅ Customers created');

  // Создание поставщиков
  const suppliers = await Promise.all([
    prisma.supplier.create({
      data: {
        companyId: testCompany.id,
        name: 'ООО "КомпьютерМир"',
        email: 'supply@compworld.ru',
        phone: '+7 495 444 55 66',
        address: 'г. Москва, ул. Компьютерная, д. 1',
        taxId: '7703456789',
      },
    }),
    prisma.supplier.create({
      data: {
        companyId: testCompany.id,
        name: 'ООО "Электроника Плюс"',
        email: 'info@electronics-plus.ru',
        phone: '+7 495 555 66 77',
        address: 'г. Москва, ул. Электронная, д. 10',
        taxId: '7704567890',
      },
    }),
  ]);

  console.log('✅ Suppliers created');

  // Создание складов
  const warehouses = await Promise.all([
    prisma.warehouse.create({
      data: {
        companyId: testCompany.id,
        name: 'Основной склад',
        address: 'г. Москва, ул. Складская, д. 1',
        isActive: true,
      },
    }),
    prisma.warehouse.create({
      data: {
        companyId: testCompany.id,
        name: 'Склад в СПб',
        address: 'г. Санкт-Петербург, ул. Складская, д. 5',
        isActive: true,
      },
    }),
  ]);

  console.log('✅ Warehouses created');

  // Создание движений товаров (приход на склад)
  const stockMovements = await Promise.all([
    prisma.stockMovement.create({
      data: {
        companyId: testCompany.id,
        warehouseId: warehouses[0].id,
        productId: products[0].id, // Ноутбук
        movementType: 'IN',
        quantity: new Decimal(10),
        notes: 'Первичная поставка',
        createdById: adminUser.id,
      },
    }),
    prisma.stockMovement.create({
      data: {
        companyId: testCompany.id,
        warehouseId: warehouses[0].id,
        productId: products[1].id, // Мышь
        movementType: 'IN',
        quantity: new Decimal(50),
        notes: 'Первичная поставка',
        createdById: adminUser.id,
      },
    }),
    prisma.stockMovement.create({
      data: {
        companyId: testCompany.id,
        warehouseId: warehouses[0].id,
        productId: products[2].id, // Клавиатура
        movementType: 'IN',
        quantity: new Decimal(30),
        notes: 'Первичная поставка',
        createdById: adminUser.id,
      },
    }),
    prisma.stockMovement.create({
      data: {
        companyId: testCompany.id,
        warehouseId: warehouses[0].id,
        productId: products[3].id, // Монитор
        movementType: 'IN',
        quantity: new Decimal(15),
        notes: 'Первичная поставка',
        createdById: adminUser.id,
      },
    }),
    prisma.stockMovement.create({
      data: {
        companyId: testCompany.id,
        warehouseId: warehouses[0].id,
        productId: products[6].id, // iPhone
        movementType: 'IN',
        quantity: new Decimal(5),
        notes: 'Первичная поставка',
        createdById: adminUser.id,
      },
    }),
    prisma.stockMovement.create({
      data: {
        companyId: testCompany.id,
        warehouseId: warehouses[0].id,
        productId: products[7].id, // iPad
        movementType: 'IN',
        quantity: new Decimal(8),
        notes: 'Первичная поставка',
        createdById: adminUser.id,
      },
    }),
  ]);

  console.log('✅ Stock movements created');

  // Создание заказов
  const now = new Date();
  const orders = await Promise.all([
    prisma.order.create({
      data: {
        companyId: testCompany.id,
        orderNumber: `ORD-${now.getFullYear()}-001`,
        customerId: customers[0].id,
        status: 'COMPLETED',
        currency: 'RUB',
        totalAmount: new Decimal(89900 + 8990), // Ноутбук + Мышь
        notes: 'Заказ выполнен',
        createdById: managerUser.id,
        createdAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), // 30 дней назад
        items: {
          create: [
            {
              productId: products[0].id,
              quantity: new Decimal(1),
              price: new Decimal(89900),
              taxRate: 20,
            },
            {
              productId: products[1].id,
              quantity: new Decimal(1),
              price: new Decimal(8990),
              taxRate: 20,
            },
          ],
        },
      },
    }),
    prisma.order.create({
      data: {
        companyId: testCompany.id,
        orderNumber: `ORD-${now.getFullYear()}-002`,
        customerId: customers[1].id,
        status: 'IN_PROGRESS',
        currency: 'RUB',
        totalAmount: new Decimal(12990 + 45900), // Клавиатура + Монитор
        notes: 'В процессе сборки',
        createdById: managerUser.id,
        createdAt: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000), // 15 дней назад
        items: {
          create: [
            {
              productId: products[2].id,
              quantity: new Decimal(1),
              price: new Decimal(12990),
              taxRate: 20,
            },
            {
              productId: products[3].id,
              quantity: new Decimal(1),
              price: new Decimal(45900),
              taxRate: 20,
            },
          ],
        },
      },
    }),
    prisma.order.create({
      data: {
        companyId: testCompany.id,
        orderNumber: `ORD-${now.getFullYear()}-003`,
        customerId: customers[2].id,
        status: 'PENDING',
        currency: 'RUB',
        totalAmount: new Decimal(129900), // iPhone
        notes: 'Ожидает подтверждения',
        createdById: managerUser.id,
        createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), // 5 дней назад
        items: {
          create: [
            {
              productId: products[6].id,
              quantity: new Decimal(1),
              price: new Decimal(129900),
              taxRate: 20,
            },
          ],
        },
      },
    }),
    prisma.order.create({
      data: {
        companyId: testCompany.id,
        orderNumber: `ORD-${now.getFullYear()}-004`,
        supplierId: suppliers[0].id,
        status: 'COMPLETED',
        currency: 'RUB',
        totalAmount: new Decimal(69900 * 2), // 2 iPad
        notes: 'Закупка у поставщика',
        createdById: managerUser.id,
        createdAt: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000), // 20 дней назад
        items: {
          create: [
            {
              productId: products[7].id,
              quantity: new Decimal(2),
              price: new Decimal(69900),
              taxRate: 20,
            },
          ],
        },
      },
    }),
    prisma.order.create({
      data: {
        companyId: testCompany.id,
        orderNumber: `ORD-${now.getFullYear()}-005`,
        customerId: customers[3].id,
        status: 'COMPLETED',
        currency: 'RUB',
        totalAmount: new Decimal(3500 * 40), // 40 часов веб-разработки
        notes: 'Услуги веб-разработки',
        createdById: managerUser.id,
        createdAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000), // 10 дней назад
        items: {
          create: [
            {
              productId: products[4].id,
              quantity: new Decimal(40),
              price: new Decimal(3500),
              taxRate: 20,
            },
          ],
        },
      },
    }),
  ]);

  console.log('✅ Orders created');

  // Создание счетов
  const invoices = await Promise.all([
    prisma.invoice.create({
      data: {
        companyId: testCompany.id,
        invoiceNumber: `INV-${now.getFullYear()}-001`,
        orderId: orders[0].id,
        status: 'PAID',
        totalAmount: orders[0].totalAmount,
        paidAmount: orders[0].totalAmount,
        currency: 'RUB',
        taxAmount: new Decimal(Number(orders[0].totalAmount) * 20 / 120),
        issuedDate: new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000),
        dueDate: new Date(now.getTime() - 18 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.invoice.create({
      data: {
        companyId: testCompany.id,
        invoiceNumber: `INV-${now.getFullYear()}-002`,
        orderId: orders[1].id,
        status: 'PARTIALLY_PAID',
        totalAmount: orders[1].totalAmount,
        paidAmount: new Decimal(30000),
        currency: 'RUB',
        taxAmount: new Decimal(Number(orders[1].totalAmount) * 20 / 120),
        issuedDate: new Date(now.getTime() - 13 * 24 * 60 * 60 * 1000),
        dueDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.invoice.create({
      data: {
        companyId: testCompany.id,
        invoiceNumber: `INV-${now.getFullYear()}-003`,
        orderId: orders[2].id,
        status: 'ISSUED',
        totalAmount: orders[2].totalAmount,
        paidAmount: new Decimal(0),
        currency: 'RUB',
        taxAmount: new Decimal(Number(orders[2].totalAmount) * 20 / 120),
        issuedDate: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
        dueDate: new Date(now.getTime() + 17 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.invoice.create({
      data: {
        companyId: testCompany.id,
        invoiceNumber: `INV-${now.getFullYear()}-004`,
        orderId: orders[4].id,
        status: 'PAID',
        totalAmount: orders[4].totalAmount,
        paidAmount: orders[4].totalAmount,
        currency: 'RUB',
        taxAmount: new Decimal(Number(orders[4].totalAmount) * 20 / 120),
        issuedDate: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000),
        dueDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
      },
    }),
  ]);

  console.log('✅ Invoices created');

  // Создание платежей
  const payments = await Promise.all([
    prisma.payment.create({
      data: {
        companyId: testCompany.id,
        invoiceId: invoices[0].id,
        amount: invoices[0].totalAmount,
        currency: 'RUB',
        paymentMethod: 'BANK_TRANSFER',
        paymentDate: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000),
        reference: 'ПП-001234',
        notes: 'Полная оплата счёта',
        createdById: accountantUser.id,
      },
    }),
    prisma.payment.create({
      data: {
        companyId: testCompany.id,
        invoiceId: invoices[1].id,
        amount: new Decimal(30000),
        currency: 'RUB',
        paymentMethod: 'CARD',
        paymentDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
        reference: 'CARD-567890',
        notes: 'Частичная оплата',
        createdById: accountantUser.id,
      },
    }),
    prisma.payment.create({
      data: {
        companyId: testCompany.id,
        invoiceId: invoices[3].id,
        amount: invoices[3].totalAmount,
        currency: 'RUB',
        paymentMethod: 'BANK_TRANSFER',
        paymentDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
        reference: 'ПП-002345',
        notes: 'Полная оплата',
        createdById: accountantUser.id,
      },
    }),
  ]);

  console.log('✅ Payments created');

  // Создание движений товаров (расход со склада)
  await Promise.all([
    prisma.stockMovement.create({
      data: {
        companyId: testCompany.id,
        warehouseId: warehouses[0].id,
        productId: products[0].id,
        movementType: 'OUT',
        quantity: new Decimal(1),
        referenceId: orders[0].id,
        referenceType: 'ORDER',
        notes: 'Отгрузка по заказу',
        createdById: adminUser.id,
      },
    }),
    prisma.stockMovement.create({
      data: {
        companyId: testCompany.id,
        warehouseId: warehouses[0].id,
        productId: products[1].id,
        movementType: 'OUT',
        quantity: new Decimal(1),
        referenceId: orders[0].id,
        referenceType: 'ORDER',
        notes: 'Отгрузка по заказу',
        createdById: adminUser.id,
      },
    }),
    prisma.stockMovement.create({
      data: {
        companyId: testCompany.id,
        warehouseId: warehouses[0].id,
        productId: products[2].id,
        movementType: 'OUT',
        quantity: new Decimal(1),
        referenceId: orders[1].id,
        referenceType: 'ORDER',
        notes: 'Отгрузка по заказу',
        createdById: adminUser.id,
      },
    }),
    prisma.stockMovement.create({
      data: {
        companyId: testCompany.id,
        warehouseId: warehouses[0].id,
        productId: products[3].id,
        movementType: 'OUT',
        quantity: new Decimal(1),
        referenceId: orders[1].id,
        referenceType: 'ORDER',
        notes: 'Отгрузка по заказу',
        createdById: adminUser.id,
      },
    }),
    prisma.stockMovement.create({
      data: {
        companyId: testCompany.id,
        warehouseId: warehouses[0].id,
        productId: products[6].id,
        movementType: 'OUT',
        quantity: new Decimal(1),
        referenceId: orders[2].id,
        referenceType: 'ORDER',
        notes: 'Резервирование',
        createdById: adminUser.id,
      },
    }),
  ]);

  console.log('✅ Stock movements (OUT) created');

  console.log('\n🎉 Seeding completed!');
  console.log('\n📝 Test credentials:');
  console.log('Admin: admin@example.com / password123');
  console.log('Manager: manager@example.com / password123');
  console.log('Accountant: accountant@example.com / password123');
  console.log('\n📊 Created data:');
  console.log(`- ${categories.length} categories`);
  console.log(`- ${products.length} products`);
  console.log(`- ${customers.length} customers`);
  console.log(`- ${suppliers.length} suppliers`);
  console.log(`- ${warehouses.length} warehouses`);
  console.log(`- ${orders.length} orders`);
  console.log(`- ${invoices.length} invoices`);
  console.log(`- ${payments.length} payments`);
  console.log(`- ${stockMovements.length + 5} stock movements`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
