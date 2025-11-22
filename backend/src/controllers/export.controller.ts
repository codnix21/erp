import { FastifyRequest, FastifyReply } from 'fastify';
import { ExportService } from '../services/export.service';
import { AuthenticatedRequest } from '../types/auth';
import logger from '../config/logger';

const exportService = new ExportService();

export class ExportController {
  async exportOrdersToExcel(request: FastifyRequest, reply: FastifyReply) {
    try {
      const req = request as AuthenticatedRequest;
      if (!req.user?.companyId) {
        reply.code(400).send({
          success: false,
          error: { code: 'COMPANY_REQUIRED', message: 'Company context is required' },
        });
        return;
      }
      const { status, startDate, endDate } = request.query as any;

      const workbook = await exportService.exportOrdersToExcel(req.user.companyId, {
        status,
        startDate,
        endDate,
      });

      const buffer = await workbook.xlsx.writeBuffer();

      reply.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      reply.header('Content-Disposition', `attachment; filename=orders_${Date.now()}.xlsx`);
      reply.send(buffer);
    } catch (error: any) {
      logger.error('Export orders to Excel error', { error });
      reply.code(500).send({ 
        success: false,
        error: { code: 'EXPORT_ERROR', message: error.message || 'Failed to export orders' } 
      });
    }
  }

  async exportProductsToExcel(request: FastifyRequest, reply: FastifyReply) {
    try {
      const req = request as AuthenticatedRequest;
      if (!req.user?.companyId) {
        reply.code(400).send({
          success: false,
          error: { code: 'COMPANY_REQUIRED', message: 'Company context is required' },
        });
        return;
      }

      const workbook = await exportService.exportProductsToExcel(req.user.companyId);
      const buffer = await workbook.xlsx.writeBuffer();

      reply.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      reply.header('Content-Disposition', `attachment; filename=products_${Date.now()}.xlsx`);
      reply.send(buffer);
    } catch (error: any) {
      logger.error('Export products to Excel error', { error });
      reply.code(500).send({ 
        success: false,
        error: { code: 'EXPORT_ERROR', message: error.message || 'Failed to export products' } 
      });
    }
  }

  async exportInvoicesToExcel(request: FastifyRequest, reply: FastifyReply) {
    try {
      const req = request as AuthenticatedRequest;
      if (!req.user?.companyId) {
        reply.code(400).send({
          success: false,
          error: { code: 'COMPANY_REQUIRED', message: 'Company context is required' },
        });
        return;
      }
      const { status, startDate, endDate } = request.query as any;

      const workbook = await exportService.exportInvoicesToExcel(req.user.companyId, {
        status,
        startDate,
        endDate,
      });

      const buffer = await workbook.xlsx.writeBuffer();

      reply.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      reply.header('Content-Disposition', `attachment; filename=invoices_${Date.now()}.xlsx`);
      reply.send(buffer);
    } catch (error: any) {
      logger.error('Export invoices to Excel error', { error });
      reply.code(500).send({ 
        success: false,
        error: { code: 'EXPORT_ERROR', message: error.message || 'Failed to export invoices' } 
      });
    }
  }

  async exportOrderToPDF(request: FastifyRequest, reply: FastifyReply) {
    try {
      const req = request as AuthenticatedRequest;
      if (!req.user?.companyId) {
        reply.code(400).send({
          success: false,
          error: { code: 'COMPANY_REQUIRED', message: 'Company context is required' },
        });
        return;
      }
      const { id } = request.params as { id: string };

      const buffer = await exportService.exportOrderToPDF(id, req.user.companyId);

      reply.header('Content-Type', 'application/pdf');
      reply.header('Content-Disposition', `attachment; filename=order_${id}.pdf`);
      reply.send(buffer);
    } catch (error: any) {
      logger.error('Export order to PDF error', { error, orderId: id });
      reply.code(500).send({ 
        success: false,
        error: { code: 'EXPORT_ERROR', message: error.message || 'Failed to export order' } 
      });
    }
  }

  async exportInvoiceToPDF(request: FastifyRequest, reply: FastifyReply) {
    try {
      const req = request as AuthenticatedRequest;
      if (!req.user?.companyId) {
        reply.code(400).send({
          success: false,
          error: { code: 'COMPANY_REQUIRED', message: 'Company context is required' },
        });
        return;
      }
      const { id } = request.params as { id: string };

      const buffer = await exportService.exportInvoiceToPDF(id, req.user.companyId);

      reply.header('Content-Type', 'application/pdf');
      reply.header('Content-Disposition', `attachment; filename=invoice_${id}.pdf`);
      reply.send(buffer);
    } catch (error: any) {
      logger.error('Export invoice to PDF error', { error, invoiceId: id });
      reply.code(500).send({ 
        success: false,
        error: { code: 'EXPORT_ERROR', message: error.message || 'Failed to export invoice' } 
      });
    }
  }
}

