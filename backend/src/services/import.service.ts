import ExcelJS from 'exceljs';
import prisma from '../config/database';
import logger from '../config/logger';

export class ImportService {
  async importProductsFromExcel(
    fileBuffer: Buffer,
    companyId: string,
    userId: string
  ) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(fileBuffer);

    const worksheet = workbook.getWorksheet(1);
    if (!worksheet) throw new Error('Worksheet not found');

    const products = [];
    let rowNumber = 2; // Пропускаем заголовок

    worksheet.eachRow((row, rowIndex) => {
      if (rowIndex === 1) return; // Пропускаем заголовок

      const name = row.getCell(1).value?.toString();
      if (!name) return; // Пропускаем пустые строки

      const sku = row.getCell(2).value?.toString();
      const categoryName = row.getCell(3).value?.toString();
      const price = parseFloat(row.getCell(4).value?.toString() || '0');
      const currency = row.getCell(5).value?.toString() || 'RUB';
      const taxRate = parseFloat(row.getCell(6).value?.toString() || '20');
      const unit = row.getCell(7).value?.toString() || 'шт';
      const isService = row.getCell(8).value?.toString()?.toLowerCase() === 'услуга';

      products.push({
        name,
        sku: sku || undefined,
        categoryName,
        price,
        currency,
        taxRate,
        unit,
        isService,
        rowNumber,
      });

      rowNumber++;
    });

    const results = {
      success: 0,
      errors: [] as Array<{ row: number; error: string }>,
    };

    for (const productData of products) {
      try {
        // Найти или создать категорию
        let categoryId: string | undefined;
        if (productData.categoryName) {
          const category = await prisma.category.findFirst({
            where: {
              name: productData.categoryName,
              companyId,
            },
          });

          if (category) {
            categoryId = category.id;
          } else {
            const newCategory = await prisma.category.create({
              data: {
                name: productData.categoryName,
                companyId,
                createdById: userId,
              },
            });
            categoryId = newCategory.id;
          }
        }

        // Проверить уникальность SKU
        if (productData.sku) {
          const existing = await prisma.product.findFirst({
            where: {
              sku: productData.sku,
              companyId,
            },
          });

          if (existing) {
            results.errors.push({
              row: productData.rowNumber,
              error: `Артикул "${productData.sku}" уже существует`,
            });
            continue;
          }
        }

        await prisma.product.create({
          data: {
            companyId,
            name: productData.name,
            sku: productData.sku,
            categoryId,
            price: productData.price,
            currency: productData.currency,
            taxRate: productData.taxRate,
            unit: productData.unit,
            isService: productData.isService,
            createdById: userId,
          },
        });

        results.success++;
      } catch (error: any) {
        results.errors.push({
          row: productData.rowNumber,
          error: error.message || 'Неизвестная ошибка',
        });
        logger.error('Import product error', { error, productData });
      }
    }

    return results;
  }
}

