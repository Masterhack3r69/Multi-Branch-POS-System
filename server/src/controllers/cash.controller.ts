import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { z } from 'zod';

const startSessionSchema = z.object({
  branchId: z.string(),
  terminalId: z.string(),
  startAmount: z.number().min(0),
});

const endSessionSchema = z.object({
  endAmount: z.number().min(0),
});

const addTransactionSchema = z.object({
  type: z.enum(['FLOAT_IN', 'DROP', 'PAYOUT']),
  amount: z.number().positive(),
  reason: z.string().optional(),
});

export const getSessionRaw = async (userId: string, activeOnly = true) => {
    const where: any = { cashierId: userId };
    if (activeOnly) {
        where.endTime = null;
    }
    return prisma.cashSession.findFirst({
        where,
        orderBy: { startTime: 'desc' },
        include: { transactions: true }
    });
};

export const getSession = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const session = await getSessionRaw(userId);
    res.json(session);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching session' });
  }
};

export const startSession = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { branchId, terminalId, startAmount } = startSessionSchema.parse(req.body);

    // Check if active session exists
    const existing = await getSessionRaw(userId);
    if (existing) {
        return res.status(400).json({ message: 'Session already active' });
    }

    const session = await prisma.cashSession.create({
      data: {
        branchId,
        terminalId,
        cashierId: userId,
        startAmount,
      }
    });

    res.json(session);
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ errors: error.errors });
    console.error(error);
    res.status(500).json({ message: 'Error starting session' });
  }
};

export const endSession = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { endAmount } = endSessionSchema.parse(req.body);

    const session = await getSessionRaw(userId);
    if (!session) return res.status(404).json({ message: 'No active session' });

    // Calculate Expected
    // Expected = Start + CashSales - Refunds(Cash) + FloatIn - Drop - Payout
    // We need to query sales and refunds for this session time window

    const cashSales = await prisma.sale.aggregate({
        where: {
            cashierId: userId,
            createdAt: { gte: session.startTime },
            payments: { some: { method: 'CASH' } }
        },
        _sum: { total: true } // Be careful, if mixed payment, we need only cash part.
        // For MVP, assuming single payment method or simple sum.
        // Better: Query payments directly.
    });
    
    // Correct way: Sum CASH payments
    const payments = await prisma.payment.aggregate({
        where: {
            method: 'CASH',
            sale: {
                cashierId: userId,
                createdAt: { gte: session.startTime }
            }
        },
        _sum: { amount: true }
    });

    // Sum Cash Refunds (Assuming we track refund method? Schema doesn't have refund payment method, assumed CASH for now)
    // For MVP, verified Refunds are cash if original was cash? 
    // Let's assume all refunds are cash for simplicity in this MVP iteration or add checks.
    
    const transactions = await prisma.cashTransaction.findMany({
        where: { sessionId: session.id }
    });
    
    let floatIn = 0;
    let drops = 0;
    let payouts = 0;

    transactions.forEach(t => {
        if (t.type === 'FLOAT_IN') floatIn += t.amount;
        if (t.type === 'DROP') drops += t.amount;
        if (t.type === 'PAYOUT') payouts += t.amount;
    });

    const totalCashSales = payments._sum.amount || 0;
    // Refunds TODO: calculating refunds requires linking them to this session context.
    
    const expected = session.startAmount + totalCashSales + floatIn - drops - payouts;

    const updated = await prisma.cashSession.update({
        where: { id: session.id },
        data: {
            endTime: new Date(),
            endAmount,
            expectedAmount: expected
        }
    });

    res.json(updated);
  } catch (error) {
     if (error instanceof z.ZodError) return res.status(400).json({ errors: error.errors });
    console.error(error);
    res.status(500).json({ message: 'Error ending session' });
  }
};

export const addTransaction = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const data = addTransactionSchema.parse(req.body);
    
    const session = await getSessionRaw(userId);
    if (!session) return res.status(404).json({ message: 'No active session' });

    const tx = await prisma.cashTransaction.create({
        data: {
            sessionId: session.id,
            ...data
        }
    });

    res.json(tx);
  } catch (error) {
     if (error instanceof z.ZodError) return res.status(400).json({ errors: error.errors });
    console.error(error);
    res.status(500).json({ message: 'Error adding transaction' });
  }
};
