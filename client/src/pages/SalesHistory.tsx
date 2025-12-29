import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
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
      <h1 className="text-2xl font-black uppercase tracking-tighter">Sales History</h1>
      {message && <div className="p-4 border-2 border-black bg-blue-50 text-blue-900 font-mono text-sm uppercase">{message}</div>}

      <div className="flex gap-4 items-end bg-white p-6 border-2 border-black">
        <div>
          <label className="block text-xs font-bold uppercase mb-1">From</label>
          <Input 
            type="date" 
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-48"
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase mb-1">To</label>
          <Input 
            type="date" 
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-48"
          />
        </div>
      </div>

      <div className="bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>ID</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sales.map((sale: any) => (
              <TableRow key={sale.id}>
                <TableCell>{new Date(sale.createdAt).toLocaleString()}</TableCell>
                <TableCell className="font-mono text-xs">{sale.id.slice(-8)}</TableCell>
                <TableCell>${sale.total.toFixed(2)}</TableCell>
                <TableCell>{sale.items.length} items</TableCell>
                <TableCell>
                  {sale.refunds.length > 0 ? (
                    <Badge variant="destructive">Refunded</Badge>
                  ) : (
                    <Badge variant="success">Completed</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <Button 
                    variant="link"
                    size="sm"
                    onClick={() => openDetails(sale)}
                  >
                    Details / Refund
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {selectedSale && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-9999">
          <div className="bg-white p-6 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-black uppercase mb-4">Sale Details</h2>
            <div className="mb-6 grid grid-cols-3 gap-4 text-sm font-mono border-b-2 border-black pb-4">
                <div><span className="text-zinc-500">ID:</span> {selectedSale.id}</div>
                <div><span className="text-zinc-500">DATE:</span> {new Date(selectedSale.createdAt).toLocaleString()}</div>
                <div><span className="text-zinc-500">TOTAL:</span> ${selectedSale.total.toFixed(2)}</div>
            </div>
            
            <h3 className="font-bold uppercase text-sm mb-2">Items (Select to Refund)</h3>
            <div className="bg-zinc-50 border-2 border-black p-4 mb-6">
                <Table>
                    <TableHeader>
                        <TableRow className="border-b border-black">
                            <TableHead className="h-8">Item</TableHead>
                            <TableHead className="h-8">Sold</TableHead>
                            <TableHead className="h-8">Refunded</TableHead>
                            <TableHead className="h-8">Avail</TableHead>
                            <TableHead className="h-8">Refund Qty</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                    {selectedSale.items.map((item: any) => {
                         const max = getMaxRefundable(item, selectedSale);
                         const current = refundItems[item.skuId] || 0;
                         return (
                            <TableRow key={item.id} className="border-zinc-200">
                                <TableCell className="py-2">{item.skuId.slice(-6)} <span className="text-xs text-zinc-500">${item.price}</span></TableCell>
                                <TableCell className="py-2">{item.qty}</TableCell>
                                <TableCell className="py-2 text-zinc-400">{item.qty - max}</TableCell>
                                <TableCell className="py-2 font-bold">{max}</TableCell>
                                <TableCell className="py-2">
                                    <Input 
                                        type="number" 
                                        min="0" 
                                        max={max}
                                        value={current}
                                        disabled={max === 0}
                                        onChange={(e) => handleRefundQtyChange(item.skuId, parseInt(e.target.value) || 0, max)}
                                        className="w-20 h-8"
                                    />
                                </TableCell>
                            </TableRow>
                         );
                    })}
                    </TableBody>
                </Table>
            </div>

            {selectedSale.refunds.length > 0 && (
              <div className="mb-6 p-4 border-l-4 border-red-600 bg-red-50 text-red-900 text-sm font-mono">
                <p className="font-bold uppercase mb-2">Refund History:</p>
                {selectedSale.refunds.map((r: any) => (
                   <p key={r.id}>-${r.amount.toFixed(2)} ({r.reason}) - {new Date(r.createdAt).toLocaleTimeString()}</p>
                ))}
              </div>
            )}

            <div className="border-t-2 border-black pt-6 mt-4">
              <h3 className="font-bold uppercase text-sm mb-2">Process Refund</h3>
              <Input 
                type="text" 
                placeholder="REASON FOR REFUND (REQUIRED)"
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                className="mb-4"
              />
              <div className="flex justify-end gap-3">
                <Button 
                  variant="outline"
                  onClick={() => setSelectedSale(null)}
                >
                  Close
                </Button>
                <Button 
                  variant="danger"
                  onClick={handleRefund}
                  disabled={!refundReason || Object.values(refundItems).every(v => v === 0)}
                >
                  Refund Selected Items
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
