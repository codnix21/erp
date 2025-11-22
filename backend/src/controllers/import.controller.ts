import { FastifyRequest, FastifyReply } from 'fastify';
import { ImportService } from '../services/import.service';
import { AuthenticatedRequest } from '../types/auth';

const importService = new ImportService();

export class ImportController {
  async importProductsFromExcel(request: FastifyRequest, reply: FastifyReply) {
    try {
      const req = request as AuthenticatedRequest;
      if (!req.user?.companyId) {
        reply.code(400).send({ error: { message: 'Company ID is required' } });
        return;
      }
      
      const data = await request.file();

      if (!data) {
        return reply.code(400).send({ error: { message: 'File is required' } });
      }

      const buffer = await data.toBuffer();
      const result = await importService.importProductsFromExcel(
        buffer,
        req.user.companyId,
        req.user.id
      );

      reply.send({
        data: result,
        meta: {
          success: result.success,
          errors: result.errors.length,
        },
      });
    } catch (error: any) {
      reply.code(500).send({ error: { message: error.message } });
    }
  }
}

