import { z } from 'zod';
import { OrderStatus } from '@prisma/client';

export const createOrderSchema = z.object({
  body: z.object({
    customerId: z.string().uuid().optional(),
    supplierId: z.string().uuid().optional(),
    status: z.nativeEnum(OrderStatus).default(OrderStatus.DRAFT),
    currency: z.string().default('RUB'),
    notes: z.string().optional(),
    dueDate: z.string().datetime().optional(),
    items: z.array(
      z.object({
        productId: z.string().uuid(),
        quantity: z.number().positive(),
        price: z.number().nonnegative(),
        taxRate: z.number().min(0).max(100).default(20),
      })
    ).min(1),
  }),
});

export const updateOrderSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    customerId: z.string().uuid().optional(),
    supplierId: z.string().uuid().optional(),
    status: z.nativeEnum(OrderStatus).optional(),
    currency: z.string().optional(),
    notes: z.string().optional(),
    dueDate: z.string().datetime().optional(),
    items: z.array(
      z.object({
        productId: z.string().uuid(),
        quantity: z.number().positive(),
        price: z.number().nonnegative(),
        taxRate: z.number().min(0).max(100).default(20),
      })
    ).optional(),
  }),
});

export const getOrdersSchema = z.object({
  query: z.object({
    page: z.string().transform(Number).default('1'),
    limit: z.string().transform(Number).default('20'),
    status: z.nativeEnum(OrderStatus).optional(),
    customerId: z.string().uuid().optional(),
    supplierId: z.string().uuid().optional(),
    search: z.string().optional(),
  }),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>['body'];
export type UpdateOrderInput = z.infer<typeof updateOrderSchema>['body'];
export type GetOrdersInput = z.infer<typeof getOrdersSchema>['query'];

