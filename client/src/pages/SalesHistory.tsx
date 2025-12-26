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

  const handleRefund = async () => {
    if (!selectedSale || !refundReason) return;
    if (!confirm('Are you sure you want to refund this sale?')) return;

    try {
      // Full refund for MVP simplification
      await api.post(`/sales/${selectedSale.id}/refund`, {
        reason: refundReason
      });
      setMessage('Refund successful');
      setRefundReason('');
      setSelectedSale(null);
      loadSales();
    } catch (err: any) {
      setMessage('Error: ' + (err.response?.data?.message || err.message));
    }
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
                    onClick={() => setSelectedSale(sale)}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded shadow-lg max-w-lg w-full">
            <h2 className="text-xl font-bold mb-4">Sale Details</h2>
            <div className="mb-4">
              <p><strong>ID:</strong> {selectedSale.id}</p>
              <p><strong>Date:</strong> {new Date(selectedSale.createdAt).toLocaleString()}</p>
              <p><strong>Total:</strong> ${selectedSale.total.toFixed(2)}</p>
            </div>
            
            <h3 className="font-bold mb-2">Items</h3>
            <ul className="mb-4 space-y-1">
              {selectedSale.items.map((item: any) => (
                <li key={item.id} className="flex justify-between">
                  <span>{item.qty}x {item.skuId.slice(-6)}</span>
                  <span>${(item.price * item.qty).toFixed(2)}</span>
                </li>
              ))}
            </ul>

            {selectedSale.refunds.length > 0 && (
              <div className="mb-4 p-2 bg-red-50 text-red-800 rounded">
                <p className="font-bold">Already Refunded:</p>
                {selectedSale.refunds.map((r: any) => (
                   <p key={r.id}>-${r.amount.toFixed(2)} ({r.reason})</p>
                ))}
              </div>
            )}

            <div className="border-t pt-4 mt-4">
              <h3 className="font-bold mb-2">Process Refund</h3>
              <input 
                type="text" 
                className="w-full border p-2 rounded mb-2"
                placeholder="Reason for refund"
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
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Refund Sale
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
