import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

export function Reports() {
  const [activeTab, setActiveTab] = useState<'SALES' | 'INVENTORY'>('SALES');
  const [loading, setLoading] = useState(false);
  const [salesReport, setSalesReport] = useState<any>(null);
  const [inventoryReport, setInventoryReport] = useState<any>(null);

  // Sales Filters
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [branches, setBranches] = useState<any[]>([]);
  const [selectedBranch, setSelectedBranch] = useState('');

  useEffect(() => {
    fetchBranches();
  }, []);

  useEffect(() => {
      if (activeTab === 'SALES') fetchSalesReport();
      if (activeTab === 'INVENTORY') fetchInventoryReport();
  }, [activeTab, selectedBranch, dateFrom, dateTo]);

  const fetchBranches = async () => {
      try {
          const res = await api.get('/branches');
          setBranches(res.data);
      } catch (err) { console.error(err); }
  };

  const fetchSalesReport = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (selectedBranch) params.branchId = selectedBranch;
      if (dateFrom) params.from = dateFrom;
      if (dateTo) params.to = dateTo;
      
      const res = await api.get('/reports/sales', { params });
      setSalesReport(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchInventoryReport = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (selectedBranch) params.branchId = selectedBranch;
      
      const res = await api.get('/reports/inventory', { params });
      setInventoryReport(res.data);
    } catch (err) {
        console.error(err);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-black uppercase tracking-tighter">Reports & Analytics</h1>

      {/* Filters */}
      <div className="bg-white p-6 border-2 border-black flex flex-wrap gap-4 items-end">
        <div>
            <label className="block text-xs font-bold uppercase mb-1">Branch</label>
            <select 
                className="flex h-10 w-48 border-2 border-black bg-background px-3 py-2 text-sm font-bold uppercase ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono"
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
            >
                <option value="">All Branches</option>
                {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name.toUpperCase()}</option>
                ))}
            </select>
        </div>
        {activeTab === 'SALES' && (
            <>
                <div>
                    <label className="block text-xs font-bold uppercase mb-1">From</label>
                    <Input 
                        type="date" 
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold uppercase mb-1">To</label>
                    <Input 
                        type="date" 
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                    />
                </div>
            </>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-4">
        <Button 
            variant={activeTab === 'SALES' ? 'default' : 'outline'}
            onClick={() => setActiveTab('SALES')}
        >
            Sales Performance
        </Button>
        <Button 
            variant={activeTab === 'INVENTORY' ? 'default' : 'outline'}
            onClick={() => setActiveTab('INVENTORY')}
        >
            Inventory Value
        </Button>
      </div>

      {/* Content */}
      {loading ? (
          <div className="p-12 text-center text-zinc-500 font-bold uppercase tracking-wider animate-pulse">Loading Report...</div>
      ) : (
          <div className="grid gap-6">
              {activeTab === 'SALES' && salesReport && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-zinc-500 text-sm font-black uppercase">Total Sales</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-4xl font-black font-mono tracking-tight">${salesReport.summary.totalSales.toFixed(2)}</p>
                            </CardContent>
                        </Card>
                        <Card>
                             <CardHeader>
                                <CardTitle className="text-zinc-500 text-sm font-black uppercase">Transactions</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-4xl font-black font-mono tracking-tight">{salesReport.summary.totalTransactions}</p>
                            </CardContent>
                        </Card>
                        <Card>
                             <CardHeader>
                                <CardTitle className="text-zinc-500 text-sm font-black uppercase">Avg Transaction</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-4xl font-black font-mono tracking-tight text-blue-600">${salesReport.summary.averageValue.toFixed(2)}</p>
                            </CardContent>
                        </Card>
                    </div>
                  </>
              )}

              {activeTab === 'INVENTORY' && inventoryReport && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <Card>
                           <CardHeader>
                                <CardTitle className="text-zinc-500 text-sm font-black uppercase">Total Inventory Value</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-4xl font-black font-mono tracking-tight text-purple-600">${inventoryReport.totalValue.toFixed(2)}</p>
                            </CardContent>
                      </Card>
                      <Card>
                           <CardHeader>
                                <CardTitle className="text-zinc-500 text-sm font-black uppercase">Total Items (Qty)</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-4xl font-black font-mono tracking-tight">{inventoryReport.totalItems}</p>
                            </CardContent>
                      </Card>
                      <Card>
                           <CardHeader>
                                <CardTitle className="text-zinc-500 text-sm font-black uppercase">Low Stock Items</CardTitle>
                            </CardHeader>
                           <CardContent>
                                <p className="text-4xl font-black font-mono tracking-tight text-red-600">{inventoryReport.lowStockCount}</p>
                           </CardContent>
                      </Card>
                  </div>
              )}
          </div>
      )}
    </div>
  );
}
