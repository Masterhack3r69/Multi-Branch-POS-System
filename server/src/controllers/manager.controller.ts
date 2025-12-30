import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';

export const getManagerDashboardStats = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Managers can only see their branch data
    const branchId = user.branchId;
    if (!branchId) {
      return res.status(403).json({ message: 'Manager must be assigned to a branch' });
    }

    // 1. Today's Sales Stats for this branch
    const salesAgg = await prisma.sale.aggregate({
      where: {
        branchId,
        createdAt: {
          gte: today,
        },
      },
      _sum: { total: true },
      _count: { id: true },
      _avg: { total: true },
    });

    // 2. Branch Low Stock Count
    const branchStocks = await prisma.stock.findMany({
      where: { branchId },
      select: { qty: true, lowStockThreshold: true }
    });
    const lowStockCount = branchStocks.filter(s => s.qty <= s.lowStockThreshold).length;

    // 3. Branch Total Products (SKUs with stock)
    const totalProducts = await prisma.stock.count({
      where: { branchId }
    });

    // 4. Branch Staff Count (active users)
    const totalStaff = await prisma.user.count({
      where: {
        branchId,
        active: true
      }
    });

    // 5. Active Cash Sessions for this branch
    const activeCashSessions = await prisma.cashSession.count({
      where: {
        branchId,
        endTime: null
      }
    });

    // 6. Recent Sales for this branch
    const recentSales = await prisma.sale.findMany({
      where: { branchId },
      take: 10,
      orderBy: { createdAt: 'desc' }
    });

    // Add cashier names to recent sales
    const recentSalesWithCashiers = await Promise.all(
      recentSales.map(async (sale) => {
        const cashier = await prisma.user.findUnique({
          where: { id: sale.cashierId },
          select: { name: true }
        });
        return {
          ...sale,
          cashier: cashier || { name: 'Unknown' }
        };
      })
    );

    // 7. Top Selling Products Today (branch specific)
    const topProductsToday = await prisma.saleItem.groupBy({
      by: ['skuId'],
      where: {
        sale: {
          branchId,
          createdAt: {
            gte: today,
          }
        }
      },
      _sum: { qty: true },
      orderBy: {
        _sum: {
          qty: 'desc'
        }
      },
      take: 5
    });

    // Get product details for top selling items
    const topProductIds = topProductsToday.map(p => p.skuId);
    const productDetails = await prisma.sKU.findMany({
      where: { id: { in: topProductIds } },
      include: { product: { select: { name: true } } }
    });

    const topProducts = topProductsToday.map(item => {
      const sku = productDetails.find(p => p.id === item.skuId);
      return {
        skuId: item.skuId,
        productName: sku?.product.name || 'Unknown',
        quantity: item._sum.qty || 0
      };
    });

    // 8. Current Week Performance (branch specific)
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const weekStats = await prisma.sale.aggregate({
      where: {
        branchId,
        createdAt: {
          gte: weekStart,
        },
      },
      _sum: { total: true },
      _count: { id: true },
    });

    // 9. Branch Info
    const branch = await prisma.branch.findUnique({
      where: { id: branchId },
      select: { name: true, address: true }
    });

    res.json({
      branch: {
        id: branchId,
        name: branch?.name || 'Unknown',
        address: branch?.address || ''
      },
      todayStats: {
        totalRevenue: salesAgg._sum.total || 0,
        transactionCount: salesAgg._count.id || 0,
        averageSaleValue: salesAgg._avg.total || 0
      },
      weekStats: {
        totalRevenue: weekStats._sum.total || 0,
        transactionCount: weekStats._count.id || 0
      },
      inventory: {
        totalProducts,
        lowStockCount
      },
      staff: {
        totalStaff,
        activeCashSessions
      },
      recentSales: recentSalesWithCashiers,
      topProductsToday
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching manager dashboard stats' });
  }
};