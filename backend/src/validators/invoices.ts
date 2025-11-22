import { z } from 'zod';
import { InvoiceStatus } from '@prisma/client';

export const createInvoiceSchema = z.object({
  orderId: z.string().uuid().optional(),
  status: z.nativeEnum(InvoiceStatus).default(InvoiceStatus.DRAFT),
  currency: z.string().default('RUB'),
  dueDate: z.string().datetime().optional(),
  notes: z.string().optional(),
});

export const updateInvoiceSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    status: z.nativeEnum(InvoiceStatus).optional(),
    currency: z.string().optional(),
    dueDate: z.string().datetime().optional(),
    notes: z.string().optional(),
  }),
});

export const getInvoicesSchema = z.object({
  query: z.object({
    page: z.string().transform(Number).default('1'),
    limit: z.string().transform(Number).default('20'),
    status: z.nativeEnum(InvoiceStatus).optional(),
    orderId: z.string().uuid().optional(),
    search: z.string().optional(),
  }),
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
export type UpdateInvoiceInput = z.infer<typeof updateInvoiceSchema>['body'];
export type GetInvoicesInput = z.infer<typeof getInvoicesSchema>['query'];

