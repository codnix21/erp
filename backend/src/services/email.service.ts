import nodemailer from 'nodemailer';
import { getEnv } from '../config/env';
import logger from '../config/logger';

export class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    const env = getEnv();
    
    if (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASSWORD) {
      this.transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT || 587,
        secure: env.SMTP_SECURE === 'true',
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASSWORD,
        },
      });
    } else {
      logger.warn('Email service not configured. SMTP settings missing.');
    }
  }

  async sendEmail(options: {
    to: string;
    subject: string;
    html: string;
    text?: string;
  }) {
    if (!this.transporter) {
      logger.warn('Email service not available. Email not sent.', options);
      return false;
    }

    try {
      const env = getEnv();
      await this.transporter.sendMail({
        from: env.SMTP_FROM || env.SMTP_USER,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || options.html.replace(/<[^>]*>/g, ''),
      });

      logger.info('Email sent', { to: options.to, subject: options.subject });
      return true;
    } catch (error) {
      logger.error('Failed to send email', { error, options });
      return false;
    }
  }

  async sendInvoiceNotification(
    to: string,
    invoiceNumber: string,
    amount: number,
    currency: string,
    dueDate?: Date
  ) {
    const html = `
      <h2>Новый счёт выставлен</h2>
      <p>Счёт №${invoiceNumber}</p>
      <p>Сумма: ${amount.toFixed(2)} ${currency}</p>
      ${dueDate ? `<p>Срок оплаты: ${dueDate.toLocaleDateString('ru-RU')}</p>` : ''}
      <p>Пожалуйста, произведите оплату в указанные сроки.</p>
    `;

    return this.sendEmail({
      to,
      subject: `Счёт №${invoiceNumber}`,
      html,
    });
  }

  async sendPaymentConfirmation(
    to: string,
    invoiceNumber: string,
    amount: number,
    currency: string
  ) {
    const html = `
      <h2>Платёж получен</h2>
      <p>Счёт №${invoiceNumber}</p>
      <p>Сумма платежа: ${amount.toFixed(2)} ${currency}</p>
      <p>Спасибо за оплату!</p>
    `;

    return this.sendEmail({
      to,
      subject: `Платёж по счёту №${invoiceNumber}`,
      html,
    });
  }

  async sendOrderNotification(
    to: string,
    orderNumber: string,
    status: string
  ) {
    const html = `
      <h2>Статус заказа изменён</h2>
      <p>Заказ №${orderNumber}</p>
      <p>Новый статус: ${status}</p>
    `;

    return this.sendEmail({
      to,
      subject: `Заказ №${orderNumber} - ${status}`,
      html,
    });
  }
}

export const emailService = new EmailService();

