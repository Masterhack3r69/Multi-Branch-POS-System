import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';
import { useSocket } from '@/hooks/useSocket';
import { useRealtimeStore } from '@/store/realtimeStore';
import { ConnectionStatus } from '@/components/ConnectionStatus';

export function ManagerDashboard() {
  const { user } = useAuthStore();
  const { on } = useSocket();
  const { incrementNewSales } = useRealtimeStore();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchManagerStats();
  }, []);

  // Real-time updates for branch-specific events
  useEffect(() => {
    const cleanupFunctions: (() => void)[] = [];

    // Listen for new sales in this branch
    const unsubscribeSale = on('sale:created', (newSale: any) => {
      console.log('New branch sale received:', newSale);
      incrementNewSales();
      
      // Only update if sale is from manager's branch
      if (newSale.branchId === user?.branchId) {
        setStats((prev: any) => {
          if (!prev) return prev;
          
          return {
            ...prev,
            todayStats: {
              ...prev.todayStats,
              totalRevenue: prev.todayStats.totalRevenue + newSale.total,
              transactionCount: prev.todayStats.transactionCount + 1,
              averageSaleValue: (prev.todayStats.totalRevenue + newSale.total) / (prev.todayStats.transactionCount + 1)
            },
            recentSales: [newSale, ...(prev.recentSales || []).slice(0, 9)] // Keep last 10
          };
        });
      }
    });

    // Listen for stock updates in this branch
    const unsubscribeStock = on('stock:updated', (stockUpdate: any) => {
      console.log('Branch stock update received:', stockUpdate);
      
      // Only update if stock update is from manager's branch
      if (stockUpdate.branchId === user?.branchId) {
        setStats((prev: any) => {
          if (!prev) return prev;
          
          let newLowStockCount = prev.inventory.lowStockCount;
          
          // Update low stock count if this item crossed the threshold
          if (stockUpdate.isLowStock) {
            newLowStockCount = Math.max(0, newLowStockCount + 1);
          }
          
          return {
            ...prev,
            inventory: {
              ...prev.inventory,
              lowStockCount: newLowStockCount
            }
          };
        });
      }
    });

    // Listen for low stock alerts in this branch
    const unsubscribeLowStock = on('stock:low', (lowStockAlert: any) => {
      console.log('Branch low stock alert received:', lowStockAlert);
      
      // Only update if alert is from manager's branch
      if (lowStockAlert.branchId === user?.branchId) {
        setStats((prev: any) => {
          if (!prev) return prev;
          
          return {
            ...prev,
            inventory: {
              ...prev.inventory,
              lowStockCount: Math.max(0, prev.inventory.lowStockCount + 1)
            }
          };
        });
      }
    });

    // Listen for cash session events in this branch
    const unsubscribeCashSession = on('cash:session_started', (sessionData: any) => {
      console.log('Cash session started in branch:', sessionData);
      
      if (sessionData.branchId === user?.branchId) {
        setStats((prev: any) => {
          if (!prev) return prev;
          
          return {
            ...prev,
            staff: {
              ...prev.staff,
              activeCashSessions: prev.staff.activeCashSessions + 1
            }
          };
        });
      }
    });

    const unsubscribeCashSessionEnded = on('cash:session_ended', (sessionData: any) => {
      console.log('Cash session ended in branch:', sessionData);
      
      if (sessionData.branchId === user?.branchId) {
        setStats((prev: any) => {
          if (!prev) return prev;
          
          return {
            ...prev,
            staff: {
              ...prev.staff,
              activeCashSessions: Math.max(0, prev.staff.activeCashSessions - 1)
            }
          };
        });
      }
    });

    if (unsubscribeSale) cleanupFunctions.push(unsubscribeSale);
    if (unsubscribeStock) cleanupFunctions.push(unsubscribeStock);
    if (unsubscribeLowStock) cleanupFunctions.push(unsubscribeLowStock);
    if (unsubscribeCashSession) cleanupFunctions.push(unsubscribeCashSession);
    if (unsubscribeCashSessionEnded) cleanupFunctions.push(unsubscribeCashSessionEnded);

    return () => {
      cleanupFunctions.forEach(cleanup => cleanup());
    };
  }, [on, incrementNewSales, user?.branchId]);

  const fetchManagerStats = async () => {
    setLoading(true);
    try {
      const res = await api.get('/manager/dashboard');
      setStats(res.data);
    } catch (err) {
      console.error('Failed to fetch manager dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !stats) {
    return <div className="p-12 text-center text-zinc-500 font-bold uppercase tracking-wider">Loading Manager Dashboard...</div>;
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-end border-b-4 border-black pb-4">
        <div>
           <h1 className="text-4xl font-black uppercase tracking-tighter">Manager Dashboard</h1>
           <p className="text-zinc-500 font-mono text-sm uppercase">
             {stats?.branch?.name || 'Branch'} - {stats?.branch?.address || 'No address'}
           </p>
           <p className="text-zinc-400 font-mono text-xs uppercase mt-1">Overview for {new Date().toLocaleDateString()}</p>
        </div>
        <div className="text-right">
            <p className="font-bold uppercase text-sm">Welcome back,</p>
            <p className="text-xl font-black">{user?.name}</p>
            <p className="text-sm font-mono text-zinc-500 uppercase">Manager</p>
        </div>
      </div>

      {/* Today's Performance */}
      <div className="space-y-3">
        <h2 className="text-2xl font-black uppercase tracking-tight">Today's Performance</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="p-4">
              <CardTitle className="text-zinc-500 text-xs font-black uppercase tracking-wider">Revenue Today</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
               <p className="text-3xl font-black font-mono tracking-tight text-green-600">
                  {formatCurrency(stats?.todayStats?.totalRevenue || 0)}
               </p>
               <p className="text-xs text-zinc-400 font-bold uppercase mt-1">
                 {stats?.todayStats?.transactionCount || 0} transactions
               </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-4">
              <CardTitle className="text-zinc-500 text-xs font-black uppercase tracking-wider">Average Sale</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
               <p className="text-3xl font-black font-mono tracking-tight">
                  {formatCurrency(stats?.todayStats?.averageSaleValue || 0)}
               </p>
               <p className="text-xs text-zinc-400 font-bold uppercase mt-1">Per transaction</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-4">
              <CardTitle className="text-zinc-500 text-xs font-black uppercase tracking-wider">Week Performance</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
               <p className="text-3xl font-black font-mono tracking-tight text-blue-600">
                  {formatCurrency(stats?.weekStats?.totalRevenue || 0)}
               </p>
               <p className="text-xs text-zinc-400 font-bold uppercase mt-1">
                 {stats?.weekStats?.transactionCount || 0} transactions
               </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-4">
              <CardTitle className="text-zinc-500 text-xs font-black uppercase tracking-wider">Active Cashiers</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
               <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-black font-mono tracking-tight">
                     {stats?.staff?.activeCashSessions || 0}
                  </p>
                  <span className="text-xs font-bold uppercase text-green-600">Sessions</span>
               </div>
               <p className="text-xs text-zinc-400 font-bold uppercase mt-1">
                 {stats?.staff?.totalStaff || 0} total staff
               </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Branch Inventory Status */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-black uppercase tracking-tight">Branch Inventory</h2>
            <Button variant="link" className="h-auto p-0 text-xs" onClick={() => window.location.href='/inventory'}>Manage Inventory</Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="p-4">
                <CardTitle className="text-zinc-500 text-xs font-black uppercase tracking-wider">Total Products</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                 <p className="text-3xl font-black font-mono tracking-tight">
                    {stats?.inventory?.totalProducts || 0}
                 </p>
                 <p className="text-xs text-zinc-400 font-bold uppercase mt-1">SKUs in stock</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="p-4">
                <CardTitle className="text-zinc-500 text-xs font-black uppercase tracking-wider">Low Stock Alert</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                 <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-black font-mono tracking-tight text-red-600">
                       {stats?.inventory?.lowStockCount || 0}
                    </p>
                    <span className="text-xs font-bold uppercase text-red-600">Items</span>
                 </div>
                 <p className="text-xs text-zinc-400 font-bold uppercase mt-1">Need restocking</p>
              </CardContent>
            </Card>
          </div>

          {/* Top Selling Products Today */}
          <Card>
            <CardHeader className="p-4">
              <CardTitle className="text-lg font-black uppercase tracking-tight">Top Selling Products Today</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-2">
                {stats?.topProductsToday?.length > 0 ? (
                  stats.topProductsToday.map((product: any, index: number) => (
                    <div key={product.skuId} className="flex justify-between items-center py-2 border-b border-zinc-100 last:border-0">
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-black text-zinc-400">#{index + 1}</span>
                        <div>
                          <p className="font-bold text-sm">{product.productName}</p>
                          <p className="text-xs text-zinc-500">SKU: {product.skuId.slice(-8)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-mono font-bold">{product.quantity} units</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center py-8 text-zinc-500 uppercase font-bold text-sm">No sales today</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Sales */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-black uppercase tracking-tight">Recent Sales</h2>
            <Button variant="link" className="h-auto p-0 text-xs" onClick={() => window.location.href='/sales'}>View All</Button>
          </div>
          <Card>
            <CardContent className="p-4">
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {stats?.recentSales?.length > 0 ? (
                  stats.recentSales.map((sale: any) => (
                    <div key={sale.id} className="flex justify-between items-center py-2 border-b border-zinc-100 last:border-0">
                      <div>
                        <p className="font-mono text-xs font-bold">#{sale.id.slice(-8)}</p>
                        <p className="text-xs text-zinc-500">{sale.cashier?.name || 'Unknown'}</p>
                        <p className="text-xs text-zinc-400">
                          {new Date(sale.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono font-bold text-sm">{formatCurrency(sale.total)}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center py-8 text-zinc-500 uppercase font-bold text-sm">No recent sales</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-zinc-50">
          <CardHeader className="p-3">
              <div className="flex justify-between items-center">
                 <span className="text-zinc-500 text-[10px] font-black uppercase">Server</span>
                 <ConnectionStatus />
              </div>
          </CardHeader>
        </Card>
        <Card className="bg-zinc-50">
          <CardHeader className="p-3">
              <div className="flex justify-between items-center">
                 <span className="text-zinc-500 text-[10px] font-black uppercase">Branch</span>
                 <span className="font-mono font-bold text-green-600 text-xs">ONLINE</span>
              </div>
          </CardHeader>
        </Card>
        <Card className="bg-zinc-50">
          <CardHeader className="p-3">
              <div className="flex justify-between items-center">
                 <span className="text-zinc-500 text-[10px] font-black uppercase">Staff</span>
                 <span className="font-mono font-bold text-xs">{stats?.staff?.totalStaff || 0}</span>
              </div>
          </CardHeader>
        </Card>
        <Card className="bg-zinc-50">
          <CardHeader className="p-3">
              <div className="flex justify-between items-center">
                 <span className="text-zinc-500 text-[10px] font-black uppercase">DB Sync</span>
                 <span className="font-mono font-bold text-xs">LIVE</span>
              </div>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}