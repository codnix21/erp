import { z } from 'zod';

export const createUserSchema = z.object({
  body: z.object({
    email: z.string().email('Некорректный email'),
    password: z.string().min(6, 'Пароль должен быть не менее 6 символов'),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    companyId: z.string().uuid('Некорректный ID компании'),
    roleId: z.string().uuid('Некорректный ID роли'),
  }),
});

export const updateUserSchema = z.object({
  params: z.object({
    id: z.string().uuid('Некорректный ID пользователя'),
  }),
  body: z.object({
    email: z.string().email('Некорректный email').optional(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const getUserSchema = z.object({
  params: z.object({
    id: z.string().uuid('Некорректный ID пользователя'),
  }),
});

export const getUsersSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().optional(),
    companyId: z.string().uuid().optional(),
  }),
});

export const assignRoleSchema = z.object({
  params: z.object({
    id: z.string().uuid('Некорректный ID пользователя'),
  }),
  body: z.object({
    companyId: z.string().uuid('Некорректный ID компании'),
    roleId: z.string().uuid('Некорректный ID роли'),
  }),
});

export const removeRoleSchema = z.object({
  params: z.object({
    id: z.string().uuid('Некорректный ID пользователя'),
    roleId: z.string().uuid('Некорректный ID связи пользователь-компания-роль'),
  }),
});

export type CreateUserInput = z.infer<typeof createUserSchema>['body'];
export type UpdateUserInput = z.infer<typeof updateUserSchema>['body'];
export type AssignRoleInput = z.infer<typeof assignRoleSchema>['body'];

