import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  parentId: z.string().uuid().optional(),
});

export const updateCategorySchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    parentId: z.string().uuid().optional(),
  }),
});

export const getCategoriesSchema = z.object({
  query: z.object({
    parentId: z.string().uuid().optional(),
    search: z.string().optional(),
  }),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>['body'];
export type GetCategoriesInput = z.infer<typeof getCategoriesSchema>['query'];

