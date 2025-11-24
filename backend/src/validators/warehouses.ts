import { z } from 'zod';

export const createWarehouseSchema = z.object({
  name: z.string().min(1),
  address: z.string().optional(),
});

export const updateWarehouseSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    name: z.string().min(1).optional(),
    address: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const getWarehousesSchema = z.object({
  query: z.object({
    page: z.string().default('1').transform((val): number => Number(val)),
    limit: z.string().default('20').transform((val): number => Number(val)),
    search: z.string().optional(),
  }),
});

export type CreateWarehouseInput = z.infer<typeof createWarehouseSchema>;
export type UpdateWarehouseInput = z.infer<typeof updateWarehouseSchema>['body'];
export type GetWarehousesInput = z.infer<typeof getWarehousesSchema>['query'];

