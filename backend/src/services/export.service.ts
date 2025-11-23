import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { Response } from 'fastify';
import prisma from '../config/database';
import fs from 'fs';
import path from 'path';

// Переводы статусов заказов
const orderStatusLabels: Record<string, string> = {
  PENDING: 'Ожидает',
  IN_PROGRESS: 'В работе',
  COMPLETED: 'Завершён',
  CANCELLED: 'Отменён',
};

// Переводы статусов счетов
const invoiceStatusLabels: Record<string, string> = {
  DRAFT: 'Черновик',
  ISSUED: 'Выставлен',
  PAID: 'Оплачен',
  PARTIALLY_PAID: 'Частично оплачен',
  OVERDUE: 'Просрочен',
  CANCELLED: 'Отменён',
};

// Переводы действий аудита
const actionLabels: Record<string, string> = {
  CREATE: 'Создание',
  UPDATE: 'Обновление',
  DELETE: 'Удаление',
};

// Переводы типов сущностей
const entityTypeLabels: Record<string, string> = {
  Order: 'Заказ',
  Product: 'Товар',
  Customer: 'Клиент',
  Invoice: 'Счёт',
  Payment: 'Платеж',
  Supplier: 'Поставщик',
  Warehouse: 'Склад',
  User: 'Пользователь',
  Company: 'Компания',
  Category: 'Категория',
};

export class ExportService {
  async exportOrdersToExcel(
    companyId: string,
    filters?: { status?: string; startDate?: string; endDate?: string }
  ) {
    const orders = await prisma.order.findMany({
      where: {
        companyId,
        ...(filters?.status && { status: filters.status }),
        ...(filters?.startDate && {
          createdAt: { gte: new Date(filters.startDate) },
        }),
        ...(filters?.endDate && {
          createdAt: { lte: new Date(filters.endDate) },
        }),
      },
      include: {
        customer: true,
        supplier: true,
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Заказы');

    // Заголовки
    worksheet.columns = [
      { header: 'Номер', key: 'orderNumber', width: 15 },
      { header: 'Дата', key: 'createdAt', width: 15 },
      { header: 'Клиент/Поставщик', key: 'customer', width: 30 },
      { header: 'Статус', key: 'status', width: 15 },
      { header: 'Сумма', key: 'totalAmount', width: 15 },
      { header: 'Валюта', key: 'currency', width: 10 },
    ];

    // Данные
    orders.forEach((order) => {
      worksheet.addRow({
        orderNumber: order.orderNumber,
        createdAt: order.createdAt.toLocaleDateString('ru-RU'),
        customer: order.customer?.name || order.supplier?.name || '-',
        status: orderStatusLabels[order.status] || order.status,
        totalAmount: Number(order.totalAmount),
        currency: order.currency === 'RUB' ? '₽' : order.currency,
      });
    });

    // Стилизация заголовков
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    return workbook;
  }

  async exportProductsToExcel(companyId: string) {
    const products = await prisma.product.findMany({
      where: { companyId },
      include: {
        category: true,
      },
      orderBy: { name: 'asc' },
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Товары');

    worksheet.columns = [
      { header: 'Название', key: 'name', width: 30 },
      { header: 'Артикул', key: 'sku', width: 15 },
      { header: 'Категория', key: 'category', width: 20 },
      { header: 'Цена', key: 'price', width: 15 },
      { header: 'Валюта', key: 'currency', width: 10 },
      { header: 'НДС', key: 'taxRate', width: 10 },
      { header: 'Единица', key: 'unit', width: 10 },
      { header: 'Тип', key: 'type', width: 10 },
    ];

    products.forEach((product) => {
      worksheet.addRow({
        name: product.name,
        sku: product.sku || '-',
        category: product.category?.name || '-',
        price: Number(product.price),
        currency: product.currency === 'RUB' ? '₽' : product.currency,
        taxRate: `${Number(product.taxRate)}%`,
        unit: product.unit,
        type: product.isService ? 'Услуга' : 'Товар',
      });
    });

    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    return workbook;
  }

  async exportInvoicesToExcel(
    companyId: string,
    filters?: { status?: string; startDate?: string; endDate?: string }
  ) {
    const invoices = await prisma.invoice.findMany({
      where: {
        companyId,
        ...(filters?.status && { status: filters.status }),
        ...(filters?.startDate && {
          issuedDate: { gte: new Date(filters.startDate) },
        }),
        ...(filters?.endDate && {
          issuedDate: { lte: new Date(filters.endDate) },
        }),
      },
      include: {
        order: {
          include: {
            customer: true,
            supplier: true,
          },
        },
      },
      orderBy: { issuedDate: 'desc' },
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Счета');

    worksheet.columns = [
      { header: 'Номер', key: 'invoiceNumber', width: 15 },
      { header: 'Дата', key: 'issuedDate', width: 15 },
      { header: 'Клиент', key: 'customer', width: 30 },
      { header: 'Статус', key: 'status', width: 15 },
      { header: 'Сумма', key: 'totalAmount', width: 15 },
      { header: 'Оплачено', key: 'paidAmount', width: 15 },
      { header: 'Остаток', key: 'remaining', width: 15 },
      { header: 'Валюта', key: 'currency', width: 10 },
    ];

    invoices.forEach((invoice) => {
      const remaining = Number(invoice.totalAmount) - Number(invoice.paidAmount);
      worksheet.addRow({
        invoiceNumber: invoice.invoiceNumber,
        issuedDate: invoice.issuedDate
          ? invoice.issuedDate.toLocaleDateString('ru-RU')
          : '-',
        customer:
          invoice.order?.customer?.name || invoice.order?.supplier?.name || '-',
        status: invoiceStatusLabels[invoice.status] || invoice.status,
        totalAmount: Number(invoice.totalAmount),
        paidAmount: Number(invoice.paidAmount),
        remaining,
        currency: invoice.currency === 'RUB' ? '₽' : invoice.currency,
      });
    });

    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    return workbook;
  }

  async exportOrderToPDF(orderId: string, companyId: string): Promise<Buffer> {
    const order = await prisma.order.findFirst({
      where: { id: orderId, companyId },
      include: {
        customer: true,
        supplier: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) throw new Error('Order not found');

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Попытка загрузить шрифт с поддержкой кириллицы
      let cyrillicFontLoaded = false;
      try {
        // Используем системный шрифт или встроенный
        // Для Windows: C:\Windows\Fonts\arial.ttf
        // Для Linux: /usr/share/fonts/truetype/dejavu/DejaVuSans.ttf
        const fontPaths = [
          'C:\\Windows\\Fonts\\arial.ttf',
          'C:\\Windows\\Fonts\\arialuni.ttf',
          '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
          '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf',
        ];
        for (const fontPath of fontPaths) {
          if (fs.existsSync(fontPath)) {
            try {
              doc.registerFont('Cyrillic', fontPath);
              cyrillicFontLoaded = true;
              break;
            } catch (e) {
              // Продолжаем попытки
            }
          }
        }
      } catch (e) {
        // Если не удалось загрузить шрифт, используем стандартный
      }

      // Заголовок
      if (cyrillicFontLoaded) {
        doc.font('Cyrillic');
      }
      doc.fontSize(20).text(`Заказ ${order.orderNumber}`, { align: 'center' });
      doc.moveDown();

      // Информация о заказе
      if (cyrillicFontLoaded) {
        doc.font('Cyrillic');
      }
      doc.fontSize(12);
      doc.text(`Дата: ${order.createdAt.toLocaleDateString('ru-RU')}`);
      doc.text(
        `Клиент: ${order.customer?.name || order.supplier?.name || '-'}`
      );
      doc.text(`Статус: ${orderStatusLabels[order.status] || order.status}`);
      doc.moveDown();

      // Таблица позиций
      doc.fontSize(14).text('Позиции заказа:', { underline: true });
      doc.moveDown(0.5);

      const tableTop = doc.y;
      const itemHeight = 30;
      let y = tableTop;

      // Заголовки таблицы
      doc.fontSize(10);
      if (cyrillicFontLoaded) {
        doc.font('Cyrillic');
      } else {
        doc.font('Helvetica-Bold');
      }
      doc.text('№', 50, y);
      doc.text('Товар', 80, y);
      doc.text('Кол-во', 300, y);
      doc.text('Цена', 380, y);
      doc.text('Сумма', 450, y);
      y += itemHeight;

      // Данные
      if (cyrillicFontLoaded) {
        doc.font('Cyrillic');
      } else {
        doc.font('Helvetica');
      }
      order.items.forEach((item, index) => {
        const itemTotal = Number(item.quantity) * Number(item.price);
        doc.text(`${index + 1}`, 50, y);
        doc.text(item.product.name, 80, y, { width: 200 });
        doc.text(Number(item.quantity).toString(), 300, y);
        const currencySymbol = order.currency === 'RUB' ? '₽' : order.currency;
        doc.text(`${Number(item.price).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currencySymbol}`, 380, y);
        doc.text(`${itemTotal.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currencySymbol}`, 450, y);
        y += itemHeight;
      });

      // Итого
      y += 10;
      if (cyrillicFontLoaded) {
        doc.font('Cyrillic');
      } else {
        doc.font('Helvetica-Bold');
      }
      const currencySymbol = order.currency === 'RUB' ? '₽' : order.currency;
      doc.text(
        `Итого: ${Number(order.totalAmount).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currencySymbol}`,
        300,
        y
      );

      doc.end();
    });
  }

  async exportInvoiceToPDF(invoiceId: string, companyId: string): Promise<Buffer> {
    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, companyId },
      include: {
        order: {
          include: {
            customer: true,
            supplier: true,
            items: {
              include: {
                product: true,
              },
            },
          },
        },
      },
    });

    if (!invoice) throw new Error('Invoice not found');

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Попытка загрузить шрифт с поддержкой кириллицы
      let cyrillicFontLoaded = false;
      try {
        const fontPaths = [
          'C:\\Windows\\Fonts\\arial.ttf',
          'C:\\Windows\\Fonts\\arialuni.ttf',
          '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
          '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf',
        ];

        for (const fontPath of fontPaths) {
          if (fs.existsSync(fontPath)) {
            try {
              doc.registerFont('Cyrillic', fontPath);
              cyrillicFontLoaded = true;
              break;
            } catch (e) {
              // Продолжаем попытки
            }
          }
        }
      } catch (e) {
        // Если не удалось загрузить шрифт, используем стандартный
      }

      // Заголовок
      doc.fontSize(20).text(`Счёт ${invoice.invoiceNumber}`, { align: 'center' });
      doc.moveDown();

      // Информация о счёте
      if (cyrillicFontLoaded) {
        doc.font('Cyrillic');
      }
      doc.fontSize(12);
      if (invoice.issuedDate) {
        doc.text(`Дата выставления: ${invoice.issuedDate.toLocaleDateString('ru-RU')}`);
      }
      if (invoice.dueDate) {
        doc.text(`Срок оплаты: ${invoice.dueDate.toLocaleDateString('ru-RU')}`);
      }
      doc.text(
        `Клиент: ${invoice.order?.customer?.name || invoice.order?.supplier?.name || '-'}`
      );
      doc.text(`Статус: ${invoiceStatusLabels[invoice.status] || invoice.status}`);
      doc.moveDown();

      // Сумма
      doc.fontSize(16);
      if (cyrillicFontLoaded) {
        doc.font('Cyrillic');
      } else {
        doc.font('Helvetica-Bold');
      }
      const currencySymbol = invoice.currency === 'RUB' ? '₽' : invoice.currency;
      doc.text(
        `Сумма к оплате: ${Number(invoice.totalAmount).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currencySymbol}`
      );
      doc.text(
        `Оплачено: ${Number(invoice.paidAmount).toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currencySymbol}`
      );
      const remaining = Number(invoice.totalAmount) - Number(invoice.paidAmount);
      doc.text(`Остаток: ${remaining.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currencySymbol}`);

      doc.end();
    });
  }

  async exportAuditLogsToExcel(
    companyId: string,
    filters?: { entityType?: string; action?: string; startDate?: string; endDate?: string }
  ) {
    const where: any = { companyId };

    if (filters?.entityType) where.entityType = filters.entityType;
    if (filters?.action) where.action = filters.action;

    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.createdAt.lte = new Date(filters.endDate);
      }
    }

    const logs = await prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Логи аудита');

    worksheet.columns = [
      { header: 'Дата и время', key: 'createdAt', width: 20 },
      { header: 'Пользователь', key: 'user', width: 25 },
      { header: 'Действие', key: 'action', width: 15 },
      { header: 'Тип записи', key: 'entityType', width: 20 },
      { header: 'ID записи', key: 'entityId', width: 40 },
      { header: 'IP адрес', key: 'ipAddress', width: 15 },
      { header: 'User Agent', key: 'userAgent', width: 50 },
    ];

    logs.forEach((log) => {
      const userName = log.user
        ? `${log.user.firstName || ''} ${log.user.lastName || ''}`.trim() || log.user.email
        : 'Система';

      worksheet.addRow({
        createdAt: log.createdAt.toLocaleString('ru-RU'),
        user: userName,
        action: actionLabels[log.action] || log.action,
        entityType: entityTypeLabels[log.entityType] || log.entityType,
        entityId: log.entityId,
        ipAddress: log.ipAddress || '-',
        userAgent: log.userAgent || '-',
      });
    });

    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    return workbook;
  }

  async exportStockMovementsToExcel(
    companyId: string,
    filters?: { warehouseId?: string; productId?: string; movementType?: string; dateFrom?: string; dateTo?: string }
  ) {
    const where: any = { companyId };

    if (filters?.warehouseId) where.warehouseId = filters.warehouseId;
    if (filters?.productId) where.productId = filters.productId;
    if (filters?.movementType) where.movementType = filters.movementType;

    if (filters?.dateFrom || filters?.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) {
        where.createdAt.gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        where.createdAt.lte = new Date(filters.dateTo);
      }
    }

    const movements = await prisma.stockMovement.findMany({
      where,
      include: {
        warehouse: {
          select: {
            name: true,
          },
        },
        product: {
          select: {
            name: true,
            sku: true,
            unit: true,
          },
        },
        createdBy: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Движения товаров');

    worksheet.columns = [
      { header: 'Дата и время', key: 'createdAt', width: 20 },
      { header: 'Склад', key: 'warehouse', width: 25 },
      { header: 'Товар', key: 'product', width: 30 },
      { header: 'Артикул', key: 'sku', width: 15 },
      { header: 'Тип движения', key: 'movementType', width: 20 },
      { header: 'Количество', key: 'quantity', width: 15 },
      { header: 'Единица', key: 'unit', width: 10 },
      { header: 'Пользователь', key: 'user', width: 25 },
      { header: 'Примечания', key: 'notes', width: 40 },
    ];

    const movementTypeLabels: Record<string, string> = {
      IN: 'Приход',
      OUT: 'Расход',
      TRANSFER: 'Перемещение',
      ADJUSTMENT: 'Корректировка',
      RESERVED: 'Резервирование',
      UNRESERVED: 'Снятие резерва',
    };

    movements.forEach((movement) => {
      const userName = movement.createdBy
        ? `${movement.createdBy.firstName || ''} ${movement.createdBy.lastName || ''}`.trim() || movement.createdBy.email
        : 'Система';

      worksheet.addRow({
        createdAt: movement.createdAt.toLocaleString('ru-RU'),
        warehouse: movement.warehouse.name,
        product: movement.product.name,
        sku: movement.product.sku || '-',
        movementType: movementTypeLabels[movement.movementType] || movement.movementType,
        quantity: Number(movement.quantity),
        unit: movement.product.unit,
        user: userName,
        notes: movement.notes || '-',
      });
    });

    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    return workbook;
  }
}

