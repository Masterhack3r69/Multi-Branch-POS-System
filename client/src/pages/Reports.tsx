import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

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
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Reports & Analytics</h1>

      {/* Filters */}
      <div className="bg-white p-4 rounded shadow flex flex-wrap gap-4 items-end">
         <div>
            <label className="block text-sm font-medium">Branch</label>
            <select 
                className="border p-2 rounded w-48"
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
            >
                <option value="">All Branches</option>
                {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                ))}
            </select>
         </div>
         {activeTab === 'SALES' && (
             <>
                <div>
                    <label className="block text-sm font-medium">From</label>
                    <input 
                        type="date" 
                        className="border p-2 rounded"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium">To</label>
                    <input 
                        type="date" 
                        className="border p-2 rounded"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                    />
                </div>
             </>
         )}
      </div>

      {/* Tabs */}
      <div className="border-b flex space-x-6">
        <button 
            className={`pb-2 px-1 ${activeTab === 'SALES' ? 'border-b-2 border-blue-600 font-bold' : 'text-gray-500'}`}
            onClick={() => setActiveTab('SALES')}
        >
            Sales Performance
        </button>
        <button 
            className={`pb-2 px-1 ${activeTab === 'INVENTORY' ? 'border-b-2 border-blue-600 font-bold' : 'text-gray-500'}`}
            onClick={() => setActiveTab('INVENTORY')}
        >
            Inventory Value
        </button>
      </div>

      {/* Content */}
      {loading ? (
          <div className="p-8 text-center text-gray-500">Loading Report...</div>
      ) : (
          <div className="grid gap-6">
              {activeTab === 'SALES' && salesReport && (
                  <>
                    <div className="grid grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded shadow">
                            <h3 className="text-gray-500 text-sm font-bold uppercase">Total Sales</h3>
                            <p className="text-3xl font-bold text-green-600">${salesReport.summary.totalSales.toFixed(2)}</p>
                        </div>
                        <div className="bg-white p-6 rounded shadow">
                            <h3 className="text-gray-500 text-sm font-bold uppercase">Transactions</h3>
                            <p className="text-3xl font-bold">{salesReport.summary.totalTransactions}</p>
                        </div>
                        <div className="bg-white p-6 rounded shadow">
                            <h3 className="text-gray-500 text-sm font-bold uppercase">Avg Transaction</h3>
                            <p className="text-3xl font-bold text-blue-600">${salesReport.summary.averageValue.toFixed(2)}</p>
                        </div>
                    </div>
                  </>
              )}

              {activeTab === 'INVENTORY' && inventoryReport && (
                  <div className="grid grid-cols-3 gap-6">
                      <div className="bg-white p-6 rounded shadow">
                          <h3 className="text-gray-500 text-sm font-bold uppercase">Total Inventory Value</h3>
                          <p className="text-3xl font-bold text-purple-600">${inventoryReport.totalValue.toFixed(2)}</p>
                      </div>
                      <div className="bg-white p-6 rounded shadow">
                          <h3 className="text-gray-500 text-sm font-bold uppercase">Total Items (Qty)</h3>
                          <p className="text-3xl font-bold">{inventoryReport.totalItems}</p>
                      </div>
                      <div className="bg-white p-6 rounded shadow">
                          <h3 className="text-gray-500 text-sm font-bold uppercase">Low Stock Items</h3>
                          <p className="text-3xl font-bold text-red-600">{inventoryReport.lowStockCount}</p>
                      </div>
                  </div>
              )}
          </div>
      )}
    </div>
  );
}
