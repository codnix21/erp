import { z } from 'zod';

export const createCustomerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  taxId: z.string().optional(),
  notes: z.string().optional(),
});

export const updateCustomerSchema = z.object({
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

export const getCustomersSchema = z.object({
  query: z.object({
    page: z.string().transform(Number).default('1'),
    limit: z.string().transform(Number).default('20'),
    search: z.string().optional(),
  }),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>['body'];
export type GetCustomersInput = z.infer<typeof getCustomersSchema>['query'];

