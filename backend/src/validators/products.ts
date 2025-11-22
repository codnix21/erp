import { z } from 'zod';

export const createProductSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    sku: z.string().optional(),
    description: z.string().optional(),
    categoryId: z.string().uuid().optional(),
    unit: z.string().default('шт'),
    price: z.number().nonnegative().default(0),
    currency: z.string().default('RUB'),
    taxRate: z.number().min(0).max(100).default(20),
    isService: z.boolean().default(false),
  }),
});

export const updateProductSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    name: z.string().min(1).optional(),
    sku: z.string().optional(),
    description: z.string().optional(),
    categoryId: z.string().uuid().optional(),
    unit: z.string().optional(),
    price: z.number().nonnegative().optional(),
    currency: z.string().optional(),
    taxRate: z.number().min(0).max(100).optional(),
    isService: z.boolean().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const getProductsSchema = z.object({
  query: z.object({
    page: z.string().transform(Number).default('1'),
    limit: z.string().transform(Number).default('20'),
    categoryId: z.string().uuid().optional(),
    search: z.string().optional(),
    isService: z.string().transform((val) => val === 'true').optional(),
  }),
});

export type CreateProductInput = z.infer<typeof createProductSchema>['body'];
export type UpdateProductInput = z.infer<typeof updateProductSchema>['body'];
export type GetProductsInput = z.infer<typeof getProductsSchema>['query'];

