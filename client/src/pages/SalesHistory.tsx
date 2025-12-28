import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

export function SalesHistory() {
  const { user } = useAuthStore();
  const [sales, setSales] = useState<any[]>([]);
  const [selectedSale, setSelectedSale] = useState<any>(null);
  const [refundReason, setRefundReason] = useState('');
  const [message, setMessage] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [refundItems, setRefundItems] = useState<Record<string, number>>({});

  useEffect(() => {
    loadSales();
  }, [dateFrom, dateTo]);

  const loadSales = async () => {
    try {
      const params: any = { branchId: user?.branchId };
      if (dateFrom) params.from = dateFrom;
      if (dateTo) params.to = dateTo;

      const res = await api.get('/sales', {
        params
      });
      setSales(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const openDetails = (sale: any) => {
      setSelectedSale(sale);
      setRefundReason('');
      setRefundItems({});
      setMessage('');
  };

  const handleRefundQtyChange = (skuId: string, qty: number, max: number) => {
      if (qty < 0) qty = 0;
      if (qty > max) qty = max;
      setRefundItems(prev => ({ ...prev, [skuId]: qty }));
  };

  const handleRefund = async () => {
    if (!selectedSale || !refundReason) return;
    
    // Calculate items to refund
    const itemsToRefund = Object.entries(refundItems)
        .filter(([_, qty]) => qty > 0)
        .map(([skuId, qty]) => ({ skuId, qty }));
        
    if (itemsToRefund.length === 0) {
        alert("Please select at least one item to refund");
        return;
    }

    if (!confirm(`Are you sure you want to refund ${itemsToRefund.length} items?`)) return;

    try {
      await api.post(`/sales/${selectedSale.id}/refund`, {
        reason: refundReason,
        items: itemsToRefund
      });
      setMessage('Refund successful');
      setRefundReason('');
      setRefundItems({});
      setSelectedSale(null);
      loadSales();
    } catch (err: any) {
      setMessage('Error: ' + (err.response?.data?.message || err.message));
    }
  };

  // Helper to get max refundable qty
  const getMaxRefundable = (saleItem: any, sale: any) => {
      const alreadyRefunded = sale.refunds.reduce((sum: number, r: any) => {
          const ri = r.items.find((i: any) => i.skuId === saleItem.skuId);
          return sum + (ri ? ri.qty : 0);
      }, 0);
      return saleItem.qty - alreadyRefunded;
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Sales History</h1>
      {message && <div className="p-2 mb-4 bg-blue-100 text-blue-700 rounded">{message}</div>}

      <div className="bg-white p-4 rounded shadow mb-4 flex gap-4">
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
      </div>

      <div className="bg-white p-6 rounded shadow overflow-x-auto">
        <table className="min-w-full text-left">
          <thead>
            <tr className="border-b">
              <th className="p-2">Date</th>
              <th className="p-2">ID</th>
              <th className="p-2">Total</th>
              <th className="p-2">Items</th>
              <th className="p-2">Status</th>
              <th className="p-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {sales.map((sale: any) => (
              <tr key={sale.id} className="border-b hover:bg-gray-50">
                <td className="p-2">{new Date(sale.createdAt).toLocaleString()}</td>
                <td className="p-2 font-mono text-sm">{sale.id.slice(-8)}</td>
                <td className="p-2">${sale.total.toFixed(2)}</td>
                <td className="p-2">{sale.items.length} items</td>
                <td className="p-2">
                  {sale.refunds.length > 0 ? (
                    <span className="text-red-600 bg-red-100 px-2 py-1 rounded text-xs">Refunded</span>
                  ) : (
                    <span className="text-green-600 bg-green-100 px-2 py-1 rounded text-xs">Completed</span>
                  )}
                </td>
                <td className="p-2">
                  <button 
                    onClick={() => openDetails(sale)}
                    className="text-blue-600 hover:underline text-sm"
                  >
                    Details / Refund
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Sale Details</h2>
            <div className="mb-4 grid grid-cols-3 gap-4 text-sm">
                <div><strong>ID:</strong> {selectedSale.id}</div>
                <div><strong>Date:</strong> {new Date(selectedSale.createdAt).toLocaleString()}</div>
                <div><strong>Total:</strong> ${selectedSale.total.toFixed(2)}</div>
            </div>
            
            <h3 className="font-bold mb-2">Items (Select to Refund)</h3>
            <div className="bg-gray-50 p-2 rounded mb-4">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-left text-gray-500">
                            <th className="pb-2">Item</th>
                            <th className="pb-2">Sold</th>
                            <th className="pb-2">Refunded</th>
                            <th className="pb-2">Available</th>
                            <th className="pb-2">Refund Qty</th>
                        </tr>
                    </thead>
                    <tbody>
                    {selectedSale.items.map((item: any) => {
                         const max = getMaxRefundable(item, selectedSale);
                         const current = refundItems[item.skuId] || 0;
                         return (
                            <tr key={item.id} className="border-t">
                                <td className="py-2">{item.skuId.slice(-6)} <span className="text-xs text-gray-500">${item.price}</span></td>
                                <td className="py-2">{item.qty}</td>
                                <td className="py-2">{item.qty - max}</td>
                                <td className="py-2 font-bold">{max}</td>
                                <td className="py-2">
                                    <input 
                                        type="number" 
                                        min="0" 
                                        max={max}
                                        value={current}
                                        disabled={max === 0}
                                        onChange={(e) => handleRefundQtyChange(item.skuId, parseInt(e.target.value) || 0, max)}
                                        className="w-16 border rounded p-1"
                                    />
                                </td>
                            </tr>
                         );
                    })}
                    </tbody>
                </table>
            </div>

            {selectedSale.refunds.length > 0 && (
              <div className="mb-4 p-2 bg-red-50 text-red-800 rounded text-sm">
                <p className="font-bold">Refund History:</p>
                {selectedSale.refunds.map((r: any) => (
                   <p key={r.id}>-${r.amount.toFixed(2)} ({r.reason}) - {new Date(r.createdAt).toLocaleTimeString()}</p>
                ))}
              </div>
            )}

            <div className="border-t pt-4 mt-4">
              <h3 className="font-bold mb-2">Process Refund</h3>
              <input 
                type="text" 
                className="w-full border p-2 rounded mb-2"
                placeholder="Reason for refund (Required)"
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
              />
              <div className="flex justify-end space-x-2">
                <button 
                  onClick={() => setSelectedSale(null)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                >
                  Close
                </button>
                <button 
                  onClick={handleRefund}
                  disabled={!refundReason || Object.values(refundItems).every(v => v === 0)}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                >
                  Refund Selected Items
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
