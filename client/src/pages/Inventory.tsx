import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

export function Inventory() {
  const { user } = useAuthStore();
  const [products, setProducts] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [selectedSku, setSelectedSku] = useState('');
  const [adjustQty, setAdjustQty] = useState(0);
  const [adjustReason, setAdjustReason] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadProducts();
    loadHistory();
  }, []);

  const loadProducts = async () => {
    try {
      // Assuming we have a product list endpoint
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

  const handleAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSku || !adjustQty || !adjustReason) return;

    try {
      await api.post('/inventory/adjust', {
        skuId: selectedSku,
        branchId: user?.branchId, // For MVP assume user works in one branch
        qty: parseInt(adjustQty as any),
        reason: adjustReason
      });
      setMessage('Stock adjusted successfully');
      setAdjustQty(0);
      setAdjustReason('');
      loadHistory();
    } catch (err: any) {
      setMessage('Error: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Inventory Management</h1>
      
      {/* Adjustment Form */}
      <div className="bg-white p-6 rounded shadow">
        <h2 className="text-xl font-bold mb-4">Adjust Stock</h2>
        {message && <div className="p-2 mb-4 bg-blue-100 text-blue-700 rounded">{message}</div>}
        <form onSubmit={handleAdjust} className="space-y-4">
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
          <div className="flex space-x-4">
            <div className="flex-1">
              <label className="block text-sm font-medium">Quantity Adjustment (+/-)</label>
              <input 
                type="number" 
                className="w-full border p-2 rounded"
                value={adjustQty}
                onChange={(e) => setAdjustQty(parseInt(e.target.value))}
                required
              />
              <p className="text-xs text-gray-500">Positive to add, negative to remove.</p>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium">Reason</label>
              <input 
                type="text" 
                className="w-full border p-2 rounded"
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                placeholder="Damage, recount, etc."
                required
              />
            </div>
          </div>
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            Submit Adjustment
          </button>
        </form>
      </div>

      {/* History Table */}
      <div className="bg-white p-6 rounded shadow">
        <h2 className="text-xl font-bold mb-4">Stock Movement History</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead>
              <tr className="border-b">
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
    </div>
  );
}
