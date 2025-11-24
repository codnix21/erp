import { z } from 'zod';
import { StockMovementType } from '@prisma/client';

export const createStockMovementSchema = z.object({
  warehouseId: z.string().uuid(),
  productId: z.string().uuid(),
  movementType: z.nativeEnum(StockMovementType),
  quantity: z.number().positive(),
  referenceId: z.string().uuid().optional(),
  referenceType: z.string().optional(),
  notes: z.string().optional(),
});

export const getStockMovementsSchema = z.object({
  query: z.object({
    page: z.string().default('1').transform((val): number => Number(val)),
    limit: z.string().default('20').transform((val): number => Number(val)),
    warehouseId: z.string().uuid().optional(),
    productId: z.string().uuid().optional(),
    movementType: z.nativeEnum(StockMovementType).optional(),
    dateFrom: z.string().datetime().optional(),
    dateTo: z.string().datetime().optional(),
  }),
});

export const getStockSchema = z.object({
  query: z.object({
    warehouseId: z.string().uuid().optional(),
    productId: z.string().uuid().optional(),
  }),
});

export type CreateStockMovementInput = z.infer<typeof createStockMovementSchema>;
export type GetStockMovementsInput = z.infer<typeof getStockMovementsSchema>['query'];
export type GetStockInput = z.infer<typeof getStockSchema>['query'];

