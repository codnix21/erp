import prisma from '../config/database';
import { CreatePaymentInput, UpdatePaymentInput } from '../validators/payments';
import logger from '../config/logger';
import { createAuditLog } from '../utils/audit';
import { emailService } from './email.service';
import { Prisma } from '@prisma/client';
const { Decimal } = Prisma;
import { InvoiceStatus } from '@prisma/client';

export class PaymentService {
  async createPayment(data: CreatePaymentInput, companyId: string, userId: string, request?: any) {
    // Если есть invoiceId, проверяем и обновляем счёт
    if (data.invoiceId) {
      const invoice = await prisma.invoice.findFirst({
        where: { id: data.invoiceId, companyId },
      });

      if (!invoice) {
        throw new Error('Invoice not found');
      }

      const paymentAmount = new Decimal(data.amount);
      const newPaidAmount = invoice.paidAmount.plus(paymentAmount);

      if (newPaidAmount.gt(invoice.totalAmount)) {
        throw new Error('Payment amount exceeds invoice total');
      }

      // Обновляем статус счёта
      let newStatus = invoice.status;
      if (newPaidAmount.gte(invoice.totalAmount)) {
        newStatus = InvoiceStatus.PAID;
      } else if (newPaidAmount.gt(new Decimal(0))) {
        newStatus = InvoiceStatus.PARTIALLY_PAID;
      }

      await prisma.invoice.update({
        where: { id: data.invoiceId },
        data: {
          paidAmount: newPaidAmount,
          status: newStatus,
        },
      });
    }

    const payment = await prisma.payment.create({
      data: {
        companyId,
        invoiceId: data.invoiceId,
        amount: new Decimal(data.amount),
        currency: data.currency,
        paymentMethod: data.paymentMethod,
        paymentDate: new Date(data.paymentDate),
        reference: data.reference,
        notes: data.notes,
        createdById: userId,
      },
      include: {
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            totalAmount: true,
            paidAmount: true,
            status: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    await createAuditLog({
      companyId,
      userId,
      action: 'CREATE',
      entityType: 'Payment',
      entityId: payment.id,
      newValues: payment,
      request,
    });

    // Отправка email уведомления
    if (payment.invoice) {
      const invoice = await prisma.invoice.findUnique({
        where: { id: payment.invoice.id },
        include: {
          order: {
            include: {
              customer: true,
              supplier: true,
            },
          },
        },
      });

      if (invoice) {
        const customerEmail =
          invoice.order?.customer?.email || invoice.order?.supplier?.email;
        if (customerEmail) {
          await emailService.sendPaymentConfirmation(
            customerEmail,
            invoice.invoiceNumber,
            Number(payment.amount),
            payment.currency
          );
        }
      }
    }

    logger.info('Payment created', { paymentId: payment.id, companyId, userId });
    return payment;
  }

  async updatePayment(
    paymentId: string,
    data: UpdatePaymentInput,
    companyId: string,
    userId: string
  ) {
    const existing = await prisma.payment.findFirst({
      where: { id: paymentId, companyId },
    });

    if (!existing) throw new Error('Payment not found');

    const oldValues = { ...existing };
    const updateData: any = {};

    if (data.amount !== undefined) updateData.amount = new Decimal(data.amount);
    if (data.currency !== undefined) updateData.currency = data.currency;
    if (data.paymentMethod !== undefined) updateData.paymentMethod = data.paymentMethod;
    if (data.paymentDate !== undefined) updateData.paymentDate = new Date(data.paymentDate);
    if (data.reference !== undefined) updateData.reference = data.reference;
    if (data.notes !== undefined) updateData.notes = data.notes;

    const updated = await prisma.payment.update({
      where: { id: paymentId },
      data: updateData,
      include: {
        invoice: true,
        createdBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    await createAuditLog({
      companyId,
      userId,
      action: 'UPDATE',
      entityType: 'Payment',
      entityId: paymentId,
      oldValues,
      newValues: updated,
    });

    logger.info('Payment updated', { paymentId, companyId, userId });
    return updated;
  }

  async getPayment(paymentId: string, companyId: string) {
    const payment = await prisma.payment.findFirst({
      where: { id: paymentId, companyId },
      include: {
        invoice: {
          include: {
            order: {
              select: {
                id: true,
                orderNumber: true,
              },
            },
          },
        },
        createdBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!payment) throw new Error('Payment not found');
    return payment;
  }

  async getPayments(
    companyId: string,
    page: number = 1,
    limit: number = 20,
    filters?: {
      invoiceId?: string;
      paymentDateFrom?: string;
      paymentDateTo?: string;
    }
  ) {
    const skip = (page - 1) * limit;
    const where: any = { companyId };

    if (filters?.invoiceId) where.invoiceId = filters.invoiceId;
    if (filters?.paymentDateFrom || filters?.paymentDateTo) {
      where.paymentDate = {};
      if (filters.paymentDateFrom) {
        where.paymentDate.gte = new Date(filters.paymentDateFrom);
      }
      if (filters.paymentDateTo) {
        where.paymentDate.lte = new Date(filters.paymentDateTo);
      }
    }

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { paymentDate: 'desc' },
        include: {
          invoice: {
            select: {
              id: true,
              invoiceNumber: true,
            },
          },
        },
      }),
      prisma.payment.count({ where }),
    ]);

    return {
      data: payments,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async deletePayment(paymentId: string, companyId: string, userId: string) {
    const payment = await prisma.payment.findFirst({
      where: { id: paymentId, companyId },
      include: { invoice: true },
    });

    if (!payment) throw new Error('Payment not found');

    // Если есть связанный счёт, обновляем его
    if (payment.invoiceId && payment.invoice) {
      const newPaidAmount = payment.invoice.paidAmount.minus(payment.amount);
      let newStatus = payment.invoice.status;

      if (newPaidAmount.lte(new Decimal(0))) {
        newStatus = InvoiceStatus.ISSUED;
      } else if (newPaidAmount.lt(payment.invoice.totalAmount)) {
        newStatus = InvoiceStatus.PARTIALLY_PAID;
      }

      await prisma.invoice.update({
        where: { id: payment.invoiceId },
        data: {
          paidAmount: newPaidAmount,
          status: newStatus,
        },
      });
    }

    await prisma.payment.delete({ where: { id: paymentId } });

    await createAuditLog({
      companyId,
      userId,
      action: 'DELETE',
      entityType: 'Payment',
      entityId: paymentId,
      oldValues: payment,
    });

    logger.info('Payment deleted', { paymentId, companyId, userId });
  }
}

