import { z } from 'zod';

export const createSupplierSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  taxId: z.string().optional(),
  notes: z.string().optional(),
});

export const updateSupplierSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    name: z.string().min(1).optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    taxId: z.string().optional(),
    notes: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const getSuppliersSchema = z.object({
  query: z.object({
    page: z.string().transform(Number).default('1'),
    limit: z.string().transform(Number).default('20'),
    search: z.string().optional(),
  }),
});

export type CreateSupplierInput = z.infer<typeof createSupplierSchema>;
export type UpdateSupplierInput = z.infer<typeof updateSupplierSchema>['body'];
export type GetSuppliersInput = z.infer<typeof getSuppliersSchema>['query'];

