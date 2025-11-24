import prisma from '../config/database';
import { CreateInvoiceInput, UpdateInvoiceInput } from '../validators/invoices';
import logger from '../config/logger';
import { createAuditLog } from '../utils/audit';
import { emailService } from './email.service';
import { Prisma } from '@prisma/client';
const { Decimal } = Prisma;
import { InvoiceStatus } from '@prisma/client';

export class InvoiceService {
  async createInvoice(data: CreateInvoiceInput, companyId: string, userId: string) {
    // Если есть orderId, используем данные заказа
    let totalAmount = new Decimal(0);
    let order = null;

    if (data.orderId) {
      order = await prisma.order.findFirst({
        where: { id: data.orderId, companyId },
        include: { items: true },
      });

      if (!order) {
        throw new Error('Order not found');
      }

      totalAmount = order.totalAmount;
    }

    const invoiceNumber = await this.generateInvoiceNumber(companyId);

    const invoice = await prisma.invoice.create({
      data: {
        companyId,
        orderId: data.orderId,
        invoiceNumber,
        status: data.status,
        totalAmount,
        paidAmount: new Decimal(0),
        currency: data.currency || order?.currency || 'RUB',
        taxAmount: totalAmount.mul(new Decimal(20)).div(new Decimal(120)), // НДС 20%
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        issuedDate: data.status === InvoiceStatus.ISSUED ? new Date() : null,
        notes: data.notes,
      },
      include: {
        order: {
          include: {
            customer: true,
            supplier: true,
          },
        },
      },
    });

    await createAuditLog({
      companyId,
      userId,
      action: 'CREATE',
      entityType: 'Invoice',
      entityId: invoice.id,
      newValues: invoice,
    });

    // Отправка email уведомления
    if (invoice.status === InvoiceStatus.ISSUED && invoice.order) {
      const customerEmail =
        invoice.order.customer?.email || invoice.order.supplier?.email;
      if (customerEmail) {
        await emailService.sendInvoiceNotification(
          customerEmail,
          invoice.invoiceNumber,
          Number(invoice.totalAmount),
          invoice.currency,
          invoice.dueDate || undefined
        );
      }
    }

    logger.info('Invoice created', { invoiceId: invoice.id, companyId, userId });
    return invoice;
  }

  async updateInvoice(
    invoiceId: string,
    data: UpdateInvoiceInput,
    companyId: string,
    userId: string
  ) {
    const existing = await prisma.invoice.findFirst({
      where: { id: invoiceId, companyId },
    });

    if (!existing) throw new Error('Invoice not found');

    const oldValues = { ...existing };
    const updateData: any = {};

    if (data.status !== undefined) {
      updateData.status = data.status;
      if (data.status === InvoiceStatus.ISSUED && !existing.issuedDate) {
        updateData.issuedDate = new Date();
      }
    }
    if (data.currency !== undefined) updateData.currency = data.currency;
    if (data.dueDate !== undefined) updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;
    if (data.notes !== undefined) updateData.notes = data.notes;

    const updated = await prisma.invoice.update({
      where: { id: invoiceId },
      data: updateData,
      include: {
        order: {
          include: {
            customer: true,
            supplier: true,
          },
        },
        payments: true,
      },
    });

    await createAuditLog({
      companyId,
      userId,
      action: 'UPDATE',
      entityType: 'Invoice',
      entityId: invoiceId,
      oldValues,
      newValues: updated,
    });

    logger.info('Invoice updated', { invoiceId, companyId, userId });
    return updated;
  }

  async getInvoice(invoiceId: string, companyId: string) {
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
        payments: {
          orderBy: { paymentDate: 'desc' },
        },
      },
    });

    if (!invoice) throw new Error('Invoice not found');
    return invoice;
  }

  async getInvoices(
    companyId: string,
    page: number = 1,
    limit: number = 20,
    filters?: {
      status?: string;
      orderId?: string;
      search?: string;
    }
  ) {
    const skip = (page - 1) * limit;
    const where: any = { companyId };

    if (filters?.status) where.status = filters.status;
    if (filters?.orderId) where.orderId = filters.orderId;
    if (filters?.search) {
      where.OR = [
        { invoiceNumber: { contains: filters.search, mode: 'insensitive' } },
        { notes: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          order: {
            select: {
              id: true,
              orderNumber: true,
              customer: { select: { id: true, name: true } },
              supplier: { select: { id: true, name: true } },
            },
          },
        },
      }),
      prisma.invoice.count({ where }),
    ]);

    return {
      data: invoices,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async deleteInvoice(invoiceId: string, companyId: string, userId: string) {
    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, companyId },
    });

    if (!invoice) throw new Error('Invoice not found');

    const payments = await prisma.payment.count({ where: { invoiceId } });
    if (payments > 0) throw new Error('Cannot delete invoice with associated payments');

    await prisma.invoice.delete({ where: { id: invoiceId } });

    await createAuditLog({
      companyId,
      userId,
      action: 'DELETE',
      entityType: 'Invoice',
      entityId: invoiceId,
      oldValues: invoice,
    });

    logger.info('Invoice deleted', { invoiceId, companyId, userId });
  }

  private async generateInvoiceNumber(companyId: string): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `INV-${year}-`;

    const lastInvoice = await prisma.invoice.findFirst({
      where: {
        companyId,
        invoiceNumber: { startsWith: prefix },
      },
      orderBy: { invoiceNumber: 'desc' },
    });

    let sequence = 1;
    if (lastInvoice) {
      const lastSequence = parseInt(lastInvoice.invoiceNumber.replace(prefix, ''));
      sequence = lastSequence + 1;
    }

    return `${prefix}${sequence.toString().padStart(6, '0')}`;
  }
}

