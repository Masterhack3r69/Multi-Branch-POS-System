import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { z } from 'zod';

const createSaleItemSchema = z.object({
  skuId: z.string(),
  qty: z.number().int().positive(),
  price: z.number().positive(),
  discount: z.number().min(0).optional(),
});

const createPaymentSchema = z.object({
  method: z.string(), // CASH, CARD, etc.
  amount: z.number().positive(),
  provider: z.string().optional(),
});

const createSaleSchema = z.object({
  branchId: z.string(),
  terminalId: z.string(),
  cashierId: z.string(),
  items: z.array(createSaleItemSchema).min(1),
  payments: z.array(createPaymentSchema).min(1),
  clientSaleId: z.string().optional(), // For idempotency (future)
});

export const createSale = async (req: Request, res: Response) => {
  try {
    const data = createSaleSchema.parse(req.body);

    // Calculate totals
    const itemsTotal = data.items.reduce((sum, item) => sum + (item.price * item.qty) - (item.discount || 0), 0);
    const tax = itemsTotal * 0.1; // Simple 10% tax for now, can be configured later
    const total = itemsTotal + tax;

    // Transaction: Create Sale, Items, Payments, and Update Stock
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Sale
      const sale = await tx.sale.create({
        data: {
          branchId: data.branchId,
          terminalId: data.terminalId,
          cashierId: data.cashierId,
          total: total,
          tax: tax,
          items: {
            create: data.items.map(item => ({
              skuId: item.skuId,
              qty: item.qty,
              price: item.price,
              discount: item.discount,
            })),
          },
          payments: {
            create: data.payments.map(payment => ({
              method: payment.method,
              amount: payment.amount,
              provider: payment.provider,
            })),
          },
        },
        include: {
          items: true,
          payments: true,
        },
      });

      // 2. Update Stock
      for (const item of data.items) {
        // Find existing stock
        const stock = await tx.stock.findFirst({
          where: {
            skuId: item.skuId,
            branchId: data.branchId,
          },
        });

        if (stock) {
          // Decrement
          await tx.stock.update({
            where: { id: stock.id },
            data: { qty: stock.qty - item.qty },
          });
        } else {
          // Create negative stock if not exists (allow overdraft? or fail?)
          // Spec says "Stock accuracy" is high priority.
          // Usually POS allows selling even if system says 0 (physical item exists).
          // We will create a record with negative quantity to reflect reality.
          await tx.stock.create({
            data: {
              skuId: item.skuId,
              branchId: data.branchId,
              qty: -item.qty,
            },
          });
        }
      }

      return sale;
    });

    res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    console.error(error);
    res.status(500).json({ message: 'Error processing sale' });
  }
};
