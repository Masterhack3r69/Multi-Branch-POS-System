import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

export function Inventory() {
  const { user } = useAuthStore();
  const [products, setProducts] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [stocks, setStocks] = useState<any[]>([]);
  const [selectedSku, setSelectedSku] = useState('');
  const [adjustQty, setAdjustQty] = useState(0);
  const [adjustReason, setAdjustReason] = useState('');
  const [message, setMessage] = useState('');
  const [viewMode, setViewMode] = useState<'LEVELS' | 'HISTORY'>('LEVELS');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);

  useEffect(() => {
    loadProducts();
    loadHistory();
    loadStocks();
  }, []);

  const loadProducts = async () => {
    try {
      const res = await api.get('/products');
      setProducts(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadHistory = async () => {
    try {
      const res = await api.get('/inventory/history', {
        params: { branchId: user?.branchId }
      });
      setHistory(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadStocks = async () => {
    try {
      const endpoint = showLowStockOnly ? '/inventory/low-stock' : '/inventory/levels';
      const res = await api.get(endpoint, {
        params: { branchId: user?.branchId }
      });
      setStocks(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // Reload stocks when filter changes
  useEffect(() => {
    loadStocks();
  }, [showLowStockOnly]);

  const handleAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSku || !adjustQty || !adjustReason) return;

    try {
      await api.post('/inventory/adjust', {
        skuId: selectedSku,
        branchId: user?.branchId, 
        qtyChange: parseInt(adjustQty as any),
        reason: adjustReason
      });
      setMessage('Stock adjusted successfully');
      setAdjustQty(0);
      setAdjustReason('RESTOCK');
      loadHistory();
      loadStocks(); // Refresh levels
    } catch (err: any) {
      setMessage('Error: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Inventory Management</h1>
        <div className="space-x-2">
          <button 
            onClick={() => setViewMode('LEVELS')}
            className={`px-4 py-2 rounded ${viewMode === 'LEVELS' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            Stock Levels
          </button>
          <button 
            onClick={() => setViewMode('HISTORY')}
            className={`px-4 py-2 rounded ${viewMode === 'HISTORY' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
          >
            History
          </button>
        </div>
      </div>

      {/* Adjustment Form - Always visible or maybe collapsible? Keeping visible as per request */}
      <div className="bg-white p-6 rounded shadow">
        <h2 className="text-xl font-bold mb-4">Adjust Stock</h2>
        {message && <div className="p-2 mb-4 bg-blue-100 text-blue-700 rounded">{message}</div>}
        <form onSubmit={handleAdjust} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium">Product / SKU</label>
              <select 
                className="w-full border p-2 rounded"
                value={selectedSku}
                onChange={(e) => setSelectedSku(e.target.value)}
                required
              >
                <option value="">Select Product</option>
                {products.map(p => (
                  p.skus.map((s: any) => (
                    <option key={s.id} value={s.id}>
                      {p.name} - {s.name || s.barcode || 'Default'}
                    </option>
                  ))
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">Qty Change</label>
              <input 
                type="number" 
                className="w-full border p-2 rounded"
                value={adjustQty}
                onChange={(e) => setAdjustQty(parseInt(e.target.value))}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Reason</label>
              <select
                className="w-full border p-2 rounded"
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                required
              >
                <option value="">Select Reason</option>
                <option value="RESTOCK">Restock</option>
                <option value="DAMAGE">Damage</option>
                <option value="RECOUNT">Recount</option>
                <option value="TRANSFER">Transfer</option>
                <option value="CORRECTION">Correction</option>
              </select>
            </div>
          </div>
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            Submit Adjustment
          </button>
        </form>
      </div>

      {viewMode === 'LEVELS' && (
        <div className="bg-white p-6 rounded shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Current Stock Levels</h2>
            <div className="flex items-center space-x-2">
              <input 
                type="checkbox" 
                id="lowStock"
                checked={showLowStockOnly}
                onChange={(e) => setShowLowStockOnly(e.target.checked)}
                className="h-4 w-4"
              />
              <label htmlFor="lowStock" className="cursor-pointer select-none font-medium text-gray-700">
                Show Low Stock Only
              </label>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="p-3">Product Name</th>
                  <th className="p-3">SKU / Barcode</th>
                  <th className="p-3">Branch</th>
                  <th className="p-3">Quantity</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {stocks.map((s: any) => {
                  const isLow = s.qty <= s.lowStockThreshold;
                  return (
                    <tr key={s.id} className={`border-b hover:bg-gray-50 ${isLow ? 'bg-red-50' : ''}`}>
                      <td className="p-3 font-medium">{s.sku?.product?.name}</td>
                      <td className="p-3 text-sm text-gray-600">{s.sku?.name || s.sku?.barcode || '-'}</td>
                      <td className="p-3">{s.branch?.name}</td>
                      <td className={`p-3 font-bold ${isLow ? 'text-red-700' : 'text-gray-800'}`}>
                        {s.qty}
                      </td>
                      <td className="p-3">
                         {isLow ? (
                           <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-bold">Low Stock</span>
                         ) : (
                           <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">OK</span>
                         )}
                      </td>
                    </tr>
                  );
                })}
                {stocks.length === 0 && (
                  <tr><td colSpan={5} className="p-4 text-center text-gray-500">No stock records found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {viewMode === 'HISTORY' && (
        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-xl font-bold mb-4">Stock Movement History</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="p-2">Date</th>
                  <th className="p-2">Type</th>
                  <th className="p-2">Product</th>
                  <th className="p-2">Qty</th>
                  <th className="p-2">Reason</th>
                  <th className="p-2">User</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h: any) => (
                  <tr key={h.id} className="border-b hover:bg-gray-50">
                    <td className="p-2">{new Date(h.createdAt).toLocaleString()}</td>
                    <td className="p-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        h.type === 'SALE' ? 'bg-green-100 text-green-800' :
                        h.type === 'REFUND' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {h.type}
                      </span>
                    </td>
                    <td className="p-2">{h.sku?.product?.name} ({h.sku?.name || h.sku?.barcode})</td>
                    <td className="p-2 font-mono">{h.qty > 0 ? '+' + h.qty : h.qty}</td>
                    <td className="p-2">{h.reason || '-'}</td>
                    <td className="p-2">{h.userId || 'System'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
