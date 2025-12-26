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

const refundSaleSchema = z.object({
  items: z.array(z.object({
    skuId: z.string(),
    qty: z.number().int().positive(),
  })).optional(), // If optional, full refund
  reason: z.string().optional(),
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

      // 2. Update Stock & Log Movement
      for (const item of data.items) {
        // Find existing stock
        let stock = await tx.stock.findFirst({
          where: {
            skuId: item.skuId,
            branchId: data.branchId,
          },
        });

        if (stock) {
          // Decrement
          stock = await tx.stock.update({
            where: { id: stock.id },
            data: { qty: stock.qty - item.qty },
          });
        } else {
          // Create negative stock if not exists
          stock = await tx.stock.create({
            data: {
              skuId: item.skuId,
              branchId: data.branchId,
              qty: -item.qty,
            },
          });
        }

        // Create Movement Log
        await tx.stockMovement.create({
          data: {
            stockId: stock.id,
            skuId: item.skuId,
            branchId: data.branchId,
            type: 'SALE',
            qty: -item.qty,
            userId: data.cashierId,
          },
        });
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

export const refundSale = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { items, reason } = refundSaleSchema.parse(req.body);
    const user = (req as any).user;
    
    // Auth check should be done by middleware, but we need details
    if (!user) return res.status(401).json({ message: 'Unauthorized' });

    const sale = await prisma.sale.findUnique({
      where: { id },
      include: { items: true, refunds: { include: { items: true } } }
    });

    if (!sale) return res.status(404).json({ message: 'Sale not found' });

    // RBAC: Cashier same day only
    if (user.role === 'CASHIER') {
      const today = new Date();
      const saleDate = new Date(sale.createdAt);
      if (saleDate.toDateString() !== today.toDateString()) {
        return res.status(403).json({ message: 'Cashiers can only refund same-day sales' });
      }
    }

    // Determine items to refund
    let refundItems: { skuId: string; qty: number; price: number }[] = [];
    
    if (!items || items.length === 0) {
      // Full refund of remaining items
      // We need to calculate what has already been refunded
      const refundedMap = new Map<string, number>();
      sale.refunds.forEach(r => {
        r.items.forEach(ri => {
          refundedMap.set(ri.skuId, (refundedMap.get(ri.skuId) || 0) + ri.qty);
        });
      });

      for (const item of sale.items) {
        const refundedQty = refundedMap.get(item.skuId) || 0;
        const remainingQty = item.qty - refundedQty;
        if (remainingQty > 0) {
          // Calculate unit effective price
          const unitPrice = (item.price * item.qty - (item.discount || 0)) / item.qty;
          refundItems.push({ skuId: item.skuId, qty: remainingQty, price: unitPrice });
        }
      }
    } else {
      // Partial refund
      for (const reqItem of items) {
        const saleItem = sale.items.find(i => i.skuId === reqItem.skuId);
        if (!saleItem) {
          return res.status(400).json({ message: `SKU ${reqItem.skuId} not in this sale` });
        }

        // Check already refunded
        const alreadyRefunded = sale.refunds.reduce((sum, r) => {
          const ri = r.items.find(i => i.skuId === reqItem.skuId);
          return sum + (ri ? ri.qty : 0);
        }, 0);

        if (alreadyRefunded + reqItem.qty > saleItem.qty) {
          return res.status(400).json({ message: `Cannot refund more than sold quantity for SKU ${reqItem.skuId}` });
        }

        const unitPrice = (saleItem.price * saleItem.qty - (saleItem.discount || 0)) / saleItem.qty;
        refundItems.push({ skuId: reqItem.skuId, qty: reqItem.qty, price: unitPrice });
      }
    }

    if (refundItems.length === 0) {
      return res.status(400).json({ message: 'Nothing to refund' });
    }

    const totalRefundAmount = refundItems.reduce((sum, item) => sum + (item.price * item.qty), 0);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Refund
      const refund = await tx.refund.create({
        data: {
          saleId: sale.id,
          amount: totalRefundAmount,
          reason,
          createdBy: user.id,
          items: {
            create: refundItems.map(item => ({
              skuId: item.skuId,
              qty: item.qty,
            })),
          },
        },
        include: { items: true },
      });

      // 2. Update Stock & Log Movement
      for (const item of refundItems) {
        // Stock should exist because we sold it, but check
        const stock = await tx.stock.findUnique({
          where: { skuId_branchId: { skuId: item.skuId, branchId: sale.branchId } }
        });

        if (stock) {
          await tx.stock.update({
            where: { id: stock.id },
            data: { qty: stock.qty + item.qty },
          });

          await tx.stockMovement.create({
            data: {
              stockId: stock.id,
              skuId: item.skuId,
              branchId: sale.branchId,
              type: 'REFUND',
              qty: item.qty,
              reason: `Refund for sale ${sale.id}`,
              userId: user.id,
            },
          });
        } else {
            // Should not happen, but create if missing
            const newStock = await tx.stock.create({
                data: {
                    skuId: item.skuId,
                    branchId: sale.branchId,
                    qty: item.qty
                }
            });
             await tx.stockMovement.create({
                data: {
                  stockId: newStock.id,
                  skuId: item.skuId,
                  branchId: sale.branchId,
                  type: 'REFUND',
                  qty: item.qty,
                  reason: `Refund for sale ${sale.id}`,
                  userId: user.id,
                },
              });
        }
      }

      return refund;
    });

    res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    console.error(error);
    res.status(500).json({ message: 'Error processing refund' });
  }
};

export const getSales = async (req: Request, res: Response) => {
  try {
    const { branchId, from, to, cashierId, terminalId } = req.query;
    
    const where: any = {};
    if (branchId) where.branchId = String(branchId);
    if (cashierId) where.cashierId = String(cashierId);
    if (terminalId) where.terminalId = String(terminalId);
    
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(String(from));
      if (to) where.createdAt.lte = new Date(String(to));
    }

    // TODO: Pagination
    const sales = await prisma.sale.findMany({
      where,
      include: {
        items: true,
        payments: true,
        refunds: true
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
    res.json(sales);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching sales' });
  }
};
