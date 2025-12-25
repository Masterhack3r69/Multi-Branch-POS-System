import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { z } from 'zod';

const adjustStockSchema = z.object({
  skuId: z.string(),
  branchId: z.string(),
  qty: z.number().int(), // Delta: +10 or -5
  reason: z.string().min(1),
});

export const adjustStock = async (req: Request, res: Response) => {
  try {
    const { skuId, branchId, qty, reason } = adjustStockSchema.parse(req.body);
    // TODO: Verify user is MANAGER or ADMIN (middleware should handle this, but we need user ID for log)
    // Assuming req.user is populated by auth middleware
    const userId = (req as any).user?.id;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Find or Create Stock
      // If we are adjusting, we might be creating a record for a product that wasn't there
      const stock = await tx.stock.upsert({
        where: {
          skuId_branchId: {
            skuId,
            branchId,
          },
        },
        create: {
          skuId,
          branchId,
          qty: qty,
        },
        update: {
          qty: { increment: qty },
        },
      });

      // 2. Log Movement
      const movement = await tx.stockMovement.create({
        data: {
          stockId: stock.id,
          skuId,
          branchId,
          type: 'ADJUSTMENT',
          qty,
          reason,
          userId,
        },
      });

      return { stock, movement };
    });

    res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    console.error(error);
    res.status(500).json({ message: 'Error adjusting stock' });
  }
};

export const getStockHistory = async (req: Request, res: Response) => {
  try {
    const { skuId, branchId } = req.query;

    const where: any = {};
    if (skuId) where.skuId = String(skuId);
    if (branchId) where.branchId = String(branchId);

    const history = await prisma.stockMovement.findMany({
      where,
      include: {
        sku: { include: { product: true } },
        branch: true,
        // user: true, // if we want user details
      },
      orderBy: { createdAt: 'desc' },
      take: 100, // Limit for MVP
    });

    res.json(history);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching stock history' });
  }
};
