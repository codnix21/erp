import { z } from 'zod';

export const createCompanySchema = z.object({
  name: z.string().min(1),
  inn: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  defaultCurrency: z.string().default('RUB'),
  taxRate: z.number().min(0).max(100).default(20),
});

export const updateCompanySchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    name: z.string().min(1).optional(),
    inn: z.string().optional(),
    address: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email().optional(),
    defaultCurrency: z.string().optional(),
    taxRate: z.number().min(0).max(100).optional(),
    settings: z.record(z.string(), z.any()).optional(),
    isActive: z.boolean().optional(),
  }),
});

export const getCompaniesSchema = z.object({
  query: z.object({
    page: z.string().default('1').transform((val): number => Number(val)),
    limit: z.string().default('20').transform((val): number => Number(val)),
    search: z.string().optional(),
  }),
});

export type CreateCompanyInput = z.infer<typeof createCompanySchema>;
export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>['body'];
export type GetCompaniesInput = z.infer<typeof getCompaniesSchema>['query'];

