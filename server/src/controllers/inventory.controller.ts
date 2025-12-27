import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { z } from 'zod';

const adjustStockSchema = z.object({
  skuId: z.string(),
  branchId: z.string(),
  qtyChange: z.number().int(), // Delta: +10 or -5
  reason: z.enum(['RESTOCK', 'DAMAGE', 'RECOUNT', 'TRANSFER', 'CORRECTION']),
});

export const adjustStock = async (req: Request, res: Response) => {
  try {
    const { skuId, branchId, qtyChange, reason } = adjustStockSchema.parse(req.body);
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
          qty: qtyChange,
        },
        update: {
          qty: { increment: qtyChange },
        },
      });

      // 2. Log Movement
      const movement = await tx.stockMovement.create({
        data: {
          stockId: stock.id,
          skuId,
          branchId,
          type: 'ADJUSTMENT',
          qty: qtyChange,
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
    const user = (req as any).user;

    const where: any = {};
    if (skuId) where.skuId = String(skuId);
    
    // RBAC: If not Admin, enforce user's branch
    if (user.role !== 'ADMIN' && user.branchId) {
       where.branchId = user.branchId;
    } else if (branchId) {
       where.branchId = String(branchId);
    }

    const history = await prisma.stockMovement.findMany({
      where,
      include: {
        sku: { include: { product: true } },
        branch: true,
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

export const getLowStock = async (req: Request, res: Response) => {
  try {
    const { branchId } = req.query;
    const user = (req as any).user;
    
    const where: any = {};

    if (user.role !== 'ADMIN' && user.branchId) {
        where.branchId = user.branchId;
    } else if (branchId) {
        where.branchId = String(branchId);
    }

    const stocks = await prisma.stock.findMany({
      where,
      include: {
        sku: { include: { product: true } },
        branch: true
      }
    });

    const lowStockItems = stocks.filter(s => s.qty <= s.lowStockThreshold);

    res.json(lowStockItems);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching low stock items' });
  }
};

// Also adding a geneirc "Get Stock Levels" to show current status in UI
export const getStockLevels = async (req: Request, res: Response) => {
  try {
    const { branchId } = req.query;
    const user = (req as any).user;
    
    const where: any = {};
    
    if (user.role !== 'ADMIN' && user.branchId) {
        where.branchId = user.branchId;
    } else if (branchId) {
        where.branchId = String(branchId);
    }

    const stocks = await prisma.stock.findMany({
      where,
      include: {
        sku: { include: { product: true } },
        branch: true
      },
      orderBy: { sku: { name: 'asc' } }
    });

    res.json(stocks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching stock levels' });
  }
};
