import { z } from 'zod';
import { PaymentMethod } from '@prisma/client';

export const createPaymentSchema = z.object({
  invoiceId: z.string().uuid().optional(),
  amount: z.number().positive(),
  currency: z.string().default('RUB'),
  paymentMethod: z.nativeEnum(PaymentMethod),
  paymentDate: z.string().datetime(),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

export const updatePaymentSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    amount: z.number().positive().optional(),
    currency: z.string().optional(),
    paymentMethod: z.nativeEnum(PaymentMethod).optional(),
    paymentDate: z.string().datetime().optional(),
    reference: z.string().optional(),
    notes: z.string().optional(),
  }),
});

export const getPaymentsSchema = z.object({
  query: z.object({
    page: z.string().transform(Number).default('1'),
    limit: z.string().transform(Number).default('20'),
    invoiceId: z.string().uuid().optional(),
    paymentDateFrom: z.string().datetime().optional(),
    paymentDateTo: z.string().datetime().optional(),
  }),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type UpdatePaymentInput = z.infer<typeof updatePaymentSchema>['body'];
export type GetPaymentsInput = z.infer<typeof getPaymentsSchema>['query'];

