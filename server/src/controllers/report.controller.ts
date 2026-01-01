import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';

export const getSalesReport = async (req: Request, res: Response) => {
  try {
    const { from, to, branchId, groupBy = 'branch' } = req.query;
    
    // Auth check: Admin sees all, others see their own branch
    const user = (req as any).user;
    const targetBranchId = (user.role === 'ADMIN' && branchId) ? String(branchId) : user.branchId;

    const where: any = {};
    if (targetBranchId) where.branchId = targetBranchId;
    
    if (from || to) {
        where.createdAt = {};
        if (from) where.createdAt.gte = new Date(String(from));
        if (to) where.createdAt.lte = new Date(String(to) + 'T23:59:59.999Z');
    }

    // 1. Total Sales & Count
    const aggregations = await prisma.sale.aggregate({
        where,
        _sum: { total: true },
        _count: { id: true },
        _avg: { total: true }
    });

    // 2. Grouping (Optional for charts/lists)
    // Prisma doesn't support advanced GROUP BY with relation fields easily in one query via client types yet for all cases,
    // but we can group by branchId or cashierId
    
    let breakdown;
    if (groupBy === 'branch') {
        breakdown = await prisma.sale.groupBy({
            by: ['branchId'],
            where,
            _sum: { total: true },
            _count: { id: true },
        });
        // We'd need to fetch branch names to map IDs, but simple ID return is fine for now
    } else if (groupBy === 'user') {
         breakdown = await prisma.sale.groupBy({
            by: ['cashierId'],
            where,
            _sum: { total: true },
            _count: { id: true },
        });
    }

    res.json({
        summary: {
            totalSales: aggregations._sum.total || 0,
            totalTransactions: aggregations._count.id || 0,
            averageValue: aggregations._avg.total || 0,
        },
        breakdown
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching sales report' });
  }
};

export const getInventoryReport = async (req: Request, res: Response) => {
  try {
    const { branchId } = req.query;
    const user = (req as any).user;
    const targetBranchId = (user.role === 'ADMIN' && branchId) ? String(branchId) : user.branchId;

    const where: any = {};
    if (targetBranchId) where.branchId = targetBranchId;

    const stocks = await prisma.stock.findMany({
        where,
        include: {
            sku: {
                include: { product: true }
            }
        }
    });

    const totalItems = stocks.reduce((sum, s) => sum + s.qty, 0);
    const totalValue = stocks.reduce((sum, s) => sum + (s.qty * s.sku.product.price), 0);
    const lowStockCount = stocks.filter(s => s.qty <= s.lowStockThreshold).length;

    res.json({
        totalItems,
        totalValue,
        lowStockCount,
        // breakdown: stocks.map(...) // If detailed list needed
    });

  } catch (error) {
     console.error(error);
    res.status(500).json({ message: 'Error fetching inventory report' }); 
  }
};

export const getDashboardStats = async (_req: Request, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Sales Stats for Today
    const salesAgg = await prisma.sale.aggregate({
      where: {
        createdAt: {
          gte: today,
        },
      },
      _sum: { total: true },
      _count: { id: true },
    });

    // 2. Low Stock Count (Overall)
    // Note: We use allStocks with in-memory filter below for accurate per-item threshold comparison
    // Prisma doesn't support comparing qty <= lowStockThreshold directly in where clause
    const allStocks = await prisma.stock.findMany({ select: { qty: true, lowStockThreshold: true } });
    const lowStock = allStocks.filter(s => s.qty <= s.lowStockThreshold).length;


    // 3. Active Branches
    const activeBranches = await prisma.branch.count({
      where: { active: true }
    });

    // 4. Total Products
    const totalProducts = await prisma.product.count();

    // 5. Total Users
    const totalUsers = await prisma.user.count();

    // 4. Recent Sales
    const recentSales = await prisma.sale.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      // Schema doesn't have relations on Sale for branch/cashier yet, so skipping include
    });

    res.json({
      totalRevenue: salesAgg._sum.total || 0,
      transactionCount: salesAgg._count.id || 0,
      lowStockCount: lowStock,
      activeBranches,
      recentSales,
      totalProducts,
      totalUsers
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching dashboard stats' });
  }
};
