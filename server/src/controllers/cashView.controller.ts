import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';

export const getCashSessions = async (req: Request, res: Response) => {
  try {
    const { branchId, activeOnly } = req.query;
    const user = (req as any).user;
    
    // Build where clause
    const where: any = {};
    
    // Filter by branch (user can only see their branch unless admin)
    if (user.role !== 'ADMIN') {
      where.branchId = user.branchId;
    } else if (branchId) {
      where.branchId = String(branchId);
    }
    
    // Filter for active sessions only
    if (activeOnly === 'true') {
      where.endTime = null;
    }
    
    const sessions = await prisma.cashSession.findMany({
      where,
      include: {
        branch: {
          select: { name: true }
        },
        terminal: {
          select: { name: true }
        },
        cashier: {
          select: { name: true }
        },
        transactions: {
          select: {
            id: true,
            type: true,
            amount: true,
            reason: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { startTime: 'desc' },
      take: 20 // Limit to recent 20 sessions
    });

    // Calculate session duration and totals
    const sessionsWithStats = sessions.map(session => ({
      ...session,
      duration: session.endTime 
        ? Math.floor((new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / (1000 * 60))
        : Math.floor((new Date().getTime() - new Date(session.startTime).getTime()) / (1000 * 60)), // minutes
      totalTransactions: session.transactions.reduce((sum, tx) => sum + tx.amount, 0),
      transactionCount: session.transactions.length
    }));

    res.json(sessionsWithStats);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching cash sessions' });
  }
};

export const getCashSessionStats = async (req: Request, res: Response) => {
  try {
    const { branchId, startDate, endDate } = req.query;
    const user = (req as any).user;
    
    // Build where clause
    const where: any = {};
    
    // Filter by branch (user can only see their branch unless admin)
    if (user.role !== 'ADMIN') {
      where.branchId = user.branchId;
    } else if (branchId) {
      where.branchId = String(branchId);
    }
    
    // Date range filter
    if (startDate || endDate) {
      where.startTime = {};
      if (startDate) where.startTime.gte = new Date(String(startDate));
      if (endDate) where.startTime.lte = new Date(String(endDate) + 'T23:59:59.999Z');
    }
    
    const sessionData = await prisma.cashSession.findMany({
      where,
      include: {
        transactions: {
          select: { amount: true, type: true }
        }
      }
    });

    // Calculate statistics
    const sessionCount = sessionData.length;
    const activeSessionCount = sessionData.filter(s => !s.endTime).length;
    const completedSessionCount = sessionData.filter(s => s.endTime).length;
    
    // Calculate financial stats
    const totalStartAmount = sessionData.reduce((sum, s) => sum + s.startAmount, 0);
    const totalEndAmount = sessionData.filter(s => s.endAmount !== null).reduce((sum, s) => sum + (s.endAmount || 0), 0);
    const totalExpectedAmount = sessionData.filter(s => s.expectedAmount !== null).reduce((sum, s) => sum + (s.expectedAmount || 0), 0);
    
    // Calculate transaction totals by type
    const allTransactions = sessionData.flatMap(s => s.transactions);
    const totalFloatIn = allTransactions
      .filter(tx => tx.type === 'FLOAT_IN')
      .reduce((sum, tx) => sum + tx.amount, 0);
    const totalDrops = allTransactions
      .filter(tx => tx.type === 'DROP')
      .reduce((sum, tx) => sum + tx.amount, 0);
    const totalPayouts = allTransactions
      .filter(tx => tx.type === 'PAYOUT')
      .reduce((sum, tx) => sum + tx.amount, 0);

    res.json({
      summary: {
        totalSessions: sessionCount,
        activeSessions: activeSessionCount,
        completedSessions: completedSessionCount,
        totalStartAmount,
        totalEndAmount,
        totalExpectedAmount,
        variance: totalEndAmount - totalExpectedAmount
      },
      transactions: {
        totalFloatIn,
        totalDrops,
        totalPayouts,
        totalTransactions: allTransactions.length
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching cash session stats' });
  }
};