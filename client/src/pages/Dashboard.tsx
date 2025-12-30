import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';
import { useSocket } from '@/hooks/useSocket';
import { useRealtimeStore } from '@/store/realtimeStore';
import { ConnectionStatus } from '@/components/ConnectionStatus';

export function Dashboard() {
  const { user } = useAuthStore();
  const { on } = useSocket();
  const { incrementNewSales } = useRealtimeStore();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  // Real-time updates
  useEffect(() => {
    const cleanupFunctions: (() => void)[] = [];

    // Listen for new sales
    const unsubscribeSale = on('sale:created', (newSale: any) => {
      console.log('New sale received:', newSale);
      incrementNewSales();
      
      setStats((prev: any) => {
        if (!prev) return prev;
        
        return {
          ...prev,
          totalRevenue: prev.totalRevenue + newSale.total,
          transactionCount: prev.transactionCount + 1,
          recentSales: [newSale, ...(prev.recentSales || []).slice(0, 9)] // Keep last 10
        };
      });
    });

    // Listen for stock updates
    const unsubscribeStock = on('stock:updated', (stockUpdate: any) => {
      console.log('Stock update received:', stockUpdate);
      
      setStats((prev: any) => {
        if (!prev) return prev;
        
        let newLowStockCount = prev.lowStockCount;
        
        // Update low stock count if this item crossed the threshold
        if (stockUpdate.isLowStock) {
          newLowStockCount = Math.max(0, newLowStockCount + 1);
        }
        
        return {
          ...prev,
          lowStockCount: newLowStockCount
        };
      });
    });

    // Listen for low stock alerts
    const unsubscribeLowStock = on('stock:low', (lowStockAlert: any) => {
      console.log('Low stock alert received:', lowStockAlert);
      
      setStats((prev: any) => {
        if (!prev) return prev;
        
        return {
          ...prev,
          lowStockCount: Math.max(0, prev.lowStockCount + 1)
        };
      });
    });

    if (unsubscribeSale) cleanupFunctions.push(unsubscribeSale);
    if (unsubscribeStock) cleanupFunctions.push(unsubscribeStock);
    if (unsubscribeLowStock) cleanupFunctions.push(unsubscribeLowStock);

    return () => {
      cleanupFunctions.forEach(cleanup => cleanup());
    };
  }, [on, incrementNewSales]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reports/dashboard');
      setStats(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !stats) {
    return <div className="p-12 text-center text-zinc-500 font-bold uppercase tracking-wider">Loading Dashboard...</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end border-b-4 border-black pb-4">
        <div>
           <h1 className="text-4xl font-black uppercase tracking-tighter">Dashboard</h1>
           <p className="text-zinc-500 font-mono text-sm uppercase">Overview for {new Date().toLocaleDateString()}</p>
        </div>
        <div className="text-right">
            <p className="font-bold uppercase text-sm">Welcome back,</p>
            <p className="text-xl font-black">{user?.name}</p>
        </div>
      </div>

      {/* Summary Cards - Compact */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="col-span-2">
          <CardHeader className="p-4">
            <CardTitle className="text-zinc-500 text-[10px] font-black uppercase tracking-wider">Total Revenue (Today)</CardTitle>
          </CardHeader>
          <CardContent className="p-4 ">
             <p className="text-3xl font-black font-mono tracking-tight text-green-600">
                ${stats?.totalRevenue?.toFixed(2) || '0.00'}
             </p>
             <p className="text-[10px] text-zinc-400 font-bold uppercase mt-1">Gross sales for today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4">
            <CardTitle className="text-zinc-500 text-[10px] font-black uppercase tracking-wider">Transactions</CardTitle>
          </CardHeader>
          <CardContent className="p-4 ">
             <p className="text-3xl font-black font-mono tracking-tight">
                {stats?.transactionCount || 0}
             </p>
             <p className="text-[10px] text-zinc-400 font-bold uppercase mt-1">Processed today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4">
            <CardTitle className="text-zinc-500 text-[10px] font-black uppercase tracking-wider">Active Branches</CardTitle>
          </CardHeader>
          <CardContent className="p-4 ">
            <div className="flex items-baseline gap-2">
                 <p className="text-3xl font-black font-mono tracking-tight">
                    {stats?.activeBranches || 0}
                 </p>
                 <span className="text-[10px] font-bold uppercase text-green-600">Online</span>
            </div>
            <p className="text-[10px] text-zinc-400 font-bold uppercase mt-1">Locations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4">
            <CardTitle className="text-zinc-500 text-[10px] font-black uppercase tracking-wider">Inventory Alert</CardTitle>
          </CardHeader>
          <CardContent className="p-4 ">
             <div className="flex items-baseline gap-2">
                 <p className="text-3xl font-black font-mono tracking-tight text-red-600">
                    {stats?.lowStockCount || 0}
                 </p>
                 <span className="text-[10px] font-bold uppercase text-red-600">Items</span>
            </div>
            <p className="text-[10px] text-zinc-400 font-bold uppercase mt-1">Low stock warning</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="p-4">
             <CardTitle className="text-zinc-500 text-[10px] font-black uppercase tracking-wider">System Status</CardTitle>
          </CardHeader>
          <CardContent className="p-4 ">
              <div className="flex items-center gap-2">
                   <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-bold uppercase">Operational</span>
              </div>
              <div className="text-[10px] text-zinc-400 mt-1 font-mono">v1.0.2 • Stable</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-zinc-50">
          <CardHeader className="p-3">
             <div className="flex justify-between items-center">
                <span className="text-zinc-500 text-[10px] font-black uppercase">Products</span>
                <span className="font-mono font-bold text-lg">{stats?.totalProducts || 0}</span>
             </div>
          </CardHeader>
        </Card>
        <Card className="bg-zinc-50">
          <CardHeader className="p-3">
             <div className="flex justify-between items-center">
                <span className="text-zinc-500 text-[10px] font-black uppercase">Staff</span>
                <span className="font-mono font-bold text-lg">{stats?.totalUsers || 0}</span>
             </div>
          </CardHeader>
        </Card>
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
                <span className="text-zinc-500 text-[10px] font-black uppercase">DB Sync</span>
                <span className="font-mono font-bold text-xs">JUST NOW</span>
             </div>
          </CardHeader>
        </Card>
      </div>

      {/* Recent Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Sales Table */}
        <div className="lg:col-span-2 space-y-3">
             <div className="flex justify-between items-center">
                  <h2 className="text-lg font-black uppercase tracking-tight">Recent Sales</h2>
                  <Button variant="link" className="h-auto p-0 text-xs" onClick={() => window.location.href='/sales'}>View All</Button>
             </div>
             <div className="bg-white border rounded">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="h-8 text-[10px] uppercase font-bold">Time</TableHead>
                            <TableHead className="h-8 text-[10px] uppercase font-bold">ID</TableHead>
                            <TableHead className="h-8 text-[10px] uppercase font-bold text-right">Amount</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {stats?.recentSales?.length > 0 ? (
                            stats.recentSales.map((sale: any) => (
                                <TableRow key={sale.id} className="h-8">
                                    <TableCell className="py-2 font-mono text-xs text-zinc-500">
                                        {new Date(sale.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </TableCell>
                                    <TableCell className="py-2 font-mono text-xs font-bold truncate max-w-[100px]">
                                        {sale.id.slice(-8)}
                                    </TableCell>
                                    <TableCell className="py-2 font-mono font-bold text-right">
                                        ${sale.total.toFixed(2)}
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center py-8 text-zinc-500 uppercase font-bold text-sm">No recent sales</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
             </div>
        </div>

        {/* Quick Actions (Compact) */}
        <div className="space-y-3">
             <h2 className="text-lg font-black uppercase tracking-tight">Quick Actions</h2>
             <div className="grid grid-cols-1 gap-2">
                  <Button className="h-12 text-sm border font-bold justify-start px-4" onClick={() => window.location.href='/terminal'}>
                    POS TERMINAL
                 </Button>
                 <Button className="h-12 text-sm border font-bold justify-start px-4" variant="outline" onClick={() => window.location.href='/products'}>
                    ADD PRODUCT
                 </Button>
                 <Button className="h-12 text-sm border font-bold justify-start px-4" variant="outline" onClick={() => window.location.href='/users'}>
                    MANAGE STAFF
                 </Button>
                 <Button className="h-12 text-sm border font-bold justify-start px-4" variant="outline" onClick={() => window.location.href='/reports'}>
                    VIEW REPORTS
                 </Button>
             </div>
        </div>
      </div>
    </div>
  );
}
