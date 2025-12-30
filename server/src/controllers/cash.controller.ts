import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { z } from 'zod';
import { broadcastToBranch, broadcastToAdmin } from '../socket/socketServer';

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

    // Emit real-time cash session events
    try {
      broadcastToBranch(branchId, 'cash:session_started', {
        sessionId: session.id,
        branchId,
        terminalId,
        cashierId: userId,
        startAmount,
        startTime: session.startTime
      });
    } catch (socketError) {
      console.error('Failed to emit cash session events:', socketError);
    }

    res.json(session);
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ errors: error.errors });
    console.error(error);
    res.status(500).json({ message: 'Error starting session' });
  }
};

export const getSessionSales = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.query;
    const user = (req as any).user;
    
    if (!sessionId) {
      return res.status(400).json({ message: 'Session ID required' });
    }
    
    // Verify user owns this session
    const session = await prisma.cashSession.findFirst({
      where: {
        id: String(sessionId),
        cashierId: user.id
      }
    });
    
    if (!session) {
      return res.status(404).json({ message: 'Session not found or access denied' });
    }
    
    // Calculate total sales for this session
    const salesAgg = await prisma.sale.aggregate({
      where: {
        cashierId: user.id,
        createdAt: {
          gte: session.startTime,
          // If session ended, only include sales before end time
          ...(session.endTime ? { lte: session.endTime } : {})
        }
      },
      _sum: { total: true },
      _count: { id: true }
    });
    
    // Calculate total cash transactions (float in, drops, payouts)
    const transactionsAgg = await prisma.cashTransaction.aggregate({
      where: {
        sessionId: session.id
      },
      _sum: { amount: true }
    });
    
    const floatIn = await prisma.cashTransaction.aggregate({
      where: {
        sessionId: session.id,
        type: 'FLOAT_IN'
      },
      _sum: { amount: true }
    });
    
    const drops = await prisma.cashTransaction.aggregate({
      where: {
        sessionId: session.id,
        type: 'DROP'
      },
      _sum: { amount: true }
    });
    
    const payouts = await prisma.cashTransaction.aggregate({
      where: {
        sessionId: session.id,
        type: 'PAYOUT'
      },
      _sum: { amount: true }
    });
    
    const result = {
      sessionId: session.id,
      startTime: session.startTime,
      endTime: session.endTime,
      startAmount: session.startAmount,
      
      // Sales metrics
      totalSales: salesAgg._sum.total || 0,
      transactionCount: salesAgg._count.id || 0,
      
      // Cash movement summary
      floatInAmount: floatIn._sum.amount || 0,
      dropsAmount: drops._sum.amount || 0,
      payoutsAmount: payouts._sum.amount || 0,
      totalTransactions: transactionsAgg._sum.amount || 0,
      
      // Net calculation
      netCashMovement: (floatIn._sum.amount || 0) - (drops._sum.amount || 0) - (payouts._sum.amount || 0)
    };

    res.json(result);
  } catch (error) {
    console.error('Error fetching session sales:', error);
    res.status(500).json({ message: 'Error fetching session sales' });
  }
};

export const endSession = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { endAmount } = endSessionSchema.parse(req.body);

    const session = await getSessionRaw(userId);
    if (!session) return res.status(404).json({ message: 'No active session' });

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

    // Emit real-time cash session events
    try {
      broadcastToBranch(session.branchId, 'cash:session_ended', {
        sessionId: updated.id,
        branchId: session.branchId,
        cashierId: userId,
        endAmount,
        expectedAmount: expected,
        endTime: updated.endTime
      });
    } catch (socketError) {
      console.error('Failed to emit cash session events:', socketError);
    }

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

    // Emit real-time cash transaction events
    try {
      broadcastToBranch(session.branchId, 'cash:transaction', {
        transactionId: tx.id,
        sessionId: session.id,
        branchId: session.branchId,
        type: data.type,
        amount: data.amount,
        reason: data.reason,
        createdAt: tx.createdAt
      });
    } catch (socketError) {
      console.error('Failed to emit cash transaction events:', socketError);
    }

    res.json(tx);
  } catch (error) {
     if (error instanceof z.ZodError) return res.status(400).json({ errors: error.errors });
    console.error(error);
    res.status(500).json({ message: 'Error adding transaction' });
  }
};
