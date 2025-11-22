import prisma from '../config/database';
import { CreateCategoryInput, UpdateCategoryInput } from '../validators/categories';
import logger from '../config/logger';
import { createAuditLog } from '../utils/audit';

export class CategoryService {
  async createCategory(data: CreateCategoryInput, companyId: string, userId: string) {
    // Проверка родительской категории
    if (data.parentId) {
      const parent = await prisma.category.findFirst({
        where: { id: data.parentId, companyId },
      });
      if (!parent) {
        throw new Error('Parent category not found');
      }
    }

    const category = await prisma.category.create({
      data: {
        companyId,
        name: data.name,
        description: data.description,
        parentId: data.parentId,
      },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
          },
        },
        children: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    await createAuditLog({
      companyId,
      userId,
      action: 'CREATE',
      entityType: 'Category',
      entityId: category.id,
      newValues: category,
    });

    logger.info('Category created', { categoryId: category.id, companyId, userId });
    return category;
  }

  async updateCategory(
    categoryId: string,
    data: UpdateCategoryInput,
    companyId: string,
    userId: string
  ) {
    const existing = await prisma.category.findFirst({
      where: { id: categoryId, companyId },
    });

    if (!existing) throw new Error('Category not found');

    // Проверка на циклические ссылки
    if (data.parentId) {
      if (data.parentId === categoryId) {
        throw new Error('Category cannot be its own parent');
      }

      // Проверяем, что родитель не является потомком
      const isDescendant = await this.isDescendant(categoryId, data.parentId, companyId);
      if (isDescendant) {
        throw new Error('Cannot set parent: would create circular reference');
      }
    }

    const oldValues = { ...existing };
    const updated = await prisma.category.update({
      where: { id: categoryId },
      data,
      include: {
        parent: {
          select: {
            id: true,
            name: true,
          },
        },
        children: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    await createAuditLog({
      companyId,
      userId,
      action: 'UPDATE',
      entityType: 'Category',
      entityId: categoryId,
      oldValues,
      newValues: updated,
    });

    logger.info('Category updated', { categoryId, companyId, userId });
    return updated;
  }

  async getCategory(categoryId: string, companyId: string) {
    const category = await prisma.category.findFirst({
      where: { id: categoryId, companyId },
      include: {
        parent: true,
        children: true,
        products: {
          take: 10,
          select: {
            id: true,
            name: true,
            sku: true,
            price: true,
          },
        },
      },
    });

    if (!category) throw new Error('Category not found');
    return category;
  }

  async getCategories(
    companyId: string,
    filters?: {
      parentId?: string;
      search?: string;
    }
  ) {
    const where: any = { companyId };

    if (filters?.parentId !== undefined) {
      if (filters.parentId === null) {
        where.parentId = null; // Только корневые категории
      } else {
        where.parentId = filters.parentId;
      }
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const categories = await prisma.category.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            children: true,
            products: true,
          },
        },
      },
    });

    return categories;
  }

  async deleteCategory(categoryId: string, companyId: string, userId: string) {
    const category = await prisma.category.findFirst({
      where: { id: categoryId, companyId },
      include: {
        children: true,
        products: true,
      },
    });

    if (!category) throw new Error('Category not found');

    if (category.children.length > 0) {
      throw new Error('Cannot delete category with subcategories');
    }

    if (category.products.length > 0) {
      throw new Error('Cannot delete category with products');
    }

    await prisma.category.delete({ where: { id: categoryId } });

    await createAuditLog({
      companyId,
      userId,
      action: 'DELETE',
      entityType: 'Category',
      entityId: categoryId,
      oldValues: category,
    });

    logger.info('Category deleted', { categoryId, companyId, userId });
  }

  private async isDescendant(
    categoryId: string,
    potentialParentId: string,
    companyId: string
  ): Promise<boolean> {
    let currentId = potentialParentId;

    for (let i = 0; i < 100; i++) {
      const current = await prisma.category.findFirst({
        where: { id: currentId, companyId },
      });

      if (!current || !current.parentId) {
        return false;
      }

      if (current.parentId === categoryId) {
        return true;
      }

      currentId = current.parentId;
    }

    return false;
  }
}

