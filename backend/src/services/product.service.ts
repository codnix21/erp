import prisma from '../config/database';
import { CreateProductInput, UpdateProductInput } from '../validators/products';
import logger from '../config/logger';
import { createAuditLog } from '../utils/audit';
import { Prisma } from '@prisma/client';
const { Decimal } = Prisma;

export class ProductService {
  async createProduct(data: CreateProductInput, companyId: string, userId: string) {
    // Проверка уникальности SKU в рамках компании
    if (data.sku) {
      const existing = await prisma.product.findFirst({
        where: {
          companyId,
          sku: data.sku,
        },
      });

      if (existing) {
        throw new Error('Product with this SKU already exists');
      }
    }

    const product = await prisma.product.create({
      data: {
        companyId,
        name: data.name,
        sku: data.sku,
        description: data.description,
        categoryId: data.categoryId,
        unit: data.unit,
        price: new Decimal(data.price),
        currency: data.currency,
        taxRate: new Decimal(data.taxRate),
        isService: data.isService,
      },
      include: {
        category: true,
      },
    });

    await createAuditLog({
      companyId,
      userId,
      action: 'CREATE',
      entityType: 'Product',
      entityId: product.id,
      newValues: product,
    });

    logger.info('Product created', { productId: product.id, companyId, userId });

    return product;
  }

  async updateProduct(
    productId: string,
    data: UpdateProductInput,
    companyId: string,
    userId: string
  ) {
    const existing = await prisma.product.findFirst({
      where: {
        id: productId,
        companyId,
      },
    });

    if (!existing) {
      throw new Error('Product not found');
    }

    const oldValues = { ...existing };

    // Проверка уникальности SKU при обновлении
    if (data.sku && data.sku !== existing.sku) {
      const duplicate = await prisma.product.findFirst({
        where: {
          companyId,
          sku: data.sku,
          id: { not: productId },
        },
      });

      if (duplicate) {
        throw new Error('Product with this SKU already exists');
      }
    }

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.sku !== undefined) updateData.sku = data.sku;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
    if (data.unit !== undefined) updateData.unit = data.unit;
    if (data.price !== undefined) updateData.price = new Decimal(data.price);
    if (data.currency !== undefined) updateData.currency = data.currency;
    if (data.taxRate !== undefined) updateData.taxRate = new Decimal(data.taxRate);
    if (data.isService !== undefined) updateData.isService = data.isService;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const updated = await prisma.product.update({
      where: { id: productId },
      data: updateData,
      include: {
        category: true,
      },
    });

    await createAuditLog({
      companyId,
      userId,
      action: 'UPDATE',
      entityType: 'Product',
      entityId: productId,
      oldValues,
      newValues: updated,
    });

    logger.info('Product updated', { productId, companyId, userId });

    return updated;
  }

  async getProduct(productId: string, companyId: string) {
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        companyId,
      },
      include: {
        category: true,
      },
    });

    if (!product) {
      throw new Error('Product not found');
    }

    return product;
  }

  async getProducts(
    companyId: string,
    page: number = 1,
    limit: number = 20,
    filters?: {
      categoryId?: string;
      search?: string;
      isService?: boolean;
    }
  ) {
    const skip = (page - 1) * limit;

    const where: any = {
      companyId,
    };

    if (filters?.categoryId) {
      where.categoryId = filters.categoryId;
    }

    if (filters?.isService !== undefined) {
      where.isService = filters.isService;
    }

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { sku: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          category: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.product.count({ where }),
    ]);

    return {
      data: products,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async deleteProduct(productId: string, companyId: string, userId: string) {
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        companyId,
      },
    });

    if (!product) {
      throw new Error('Product not found');
    }

    // Проверка на использование в заказах
    const orderItems = await prisma.orderItem.count({
      where: { productId },
    });

    if (orderItems > 0) {
      throw new Error('Cannot delete product used in orders');
    }

    await prisma.product.delete({
      where: { id: productId },
    });

    await createAuditLog({
      companyId,
      userId,
      action: 'DELETE',
      entityType: 'Product',
      entityId: productId,
      oldValues: product,
    });

    logger.info('Product deleted', { productId, companyId, userId });
  }
}

