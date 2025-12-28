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
        <h1 className="text-2xl font-black uppercase tracking-tighter">Inventory Management</h1>
        <div className="flex gap-2">
          <Button 
            variant={viewMode === 'LEVELS' ? 'default' : 'outline'}
            onClick={() => setViewMode('LEVELS')}
          >
            Stock Levels
          </Button>
          <Button 
            variant={viewMode === 'HISTORY' ? 'default' : 'outline'}
            onClick={() => setViewMode('HISTORY')}
          >
            History
          </Button>
        </div>
      </div>

      {/* Adjustment Form */}
      <div className="bg-white p-6 border-2 border-black">
        <h2 className="text-xl font-black uppercase mb-4">Adjust Stock</h2>
        {message && <div className="p-4 mb-4 border-2 border-black bg-blue-50 text-blue-900 font-mono text-sm uppercase">{message}</div>}
        <form onSubmit={handleAdjust} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase mb-1">Product / SKU</label>
              <select 
                className="flex h-10 w-full border-2 border-black bg-background px-3 py-2 text-sm font-bold uppercase ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono"
                value={selectedSku}
                onChange={(e) => setSelectedSku(e.target.value)}
                required
              >
                <option value="">Select Product</option>
                {products.map(p => (
                  p.skus.map((s: any) => (
                    <option key={s.id} value={s.id}>
                      {p.name.toUpperCase()} - {s.name || s.barcode || 'DEFAULT'}
                    </option>
                  ))
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase mb-1">Qty Change</label>
              <Input 
                type="number" 
                value={adjustQty}
                onChange={(e) => setAdjustQty(parseInt(e.target.value))}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase mb-1">Reason</label>
              <select
                className="flex h-10 w-full border-2 border-black bg-background px-3 py-2 text-sm font-bold uppercase ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono"
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
          <Button type="submit">
            Submit Adjustment
          </Button>
        </form>
      </div>

      {viewMode === 'LEVELS' && (
        <div className="bg-white">
          <div className="flex justify-between items-center mb-4 p-4 border-b-2 border-black bg-zinc-50">
            <h2 className="text-xl font-black uppercase">Current Stock Levels</h2>
            <div className="flex items-center space-x-2">
              <input 
                type="checkbox" 
                id="lowStock"
                checked={showLowStockOnly}
                onChange={(e) => setShowLowStockOnly(e.target.checked)}
                className="h-4 w-4 border-2 border-black rounded-none focus:ring-black text-black"
              />
              <label htmlFor="lowStock" className="cursor-pointer select-none font-bold uppercase text-sm">
                Show Low Stock Only
              </label>
            </div>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product Name</TableHead>
                  <TableHead>SKU / Barcode</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stocks.map((s: any) => {
                  const isLow = s.qty <= s.lowStockThreshold;
                  return (
                    <TableRow key={s.id} className={isLow ? 'bg-red-50' : ''}>
                      <TableCell className="font-bold uppercase">{s.sku?.product?.name}</TableCell>
                      <TableCell className="font-mono text-xs">{s.sku?.name || s.sku?.barcode || '-'}</TableCell>
                      <TableCell className="uppercase">{s.branch?.name}</TableCell>
                      <TableCell className={`font-mono font-bold ${isLow ? 'text-red-700' : 'text-black'}`}>
                        {s.qty}
                      </TableCell>
                      <TableCell>
                         {isLow ? (
                           <Badge variant="destructive">Low Stock</Badge>
                         ) : (
                           <Badge variant="success">OK</Badge>
                         )}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {stocks.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="text-center text-zinc-500 uppercase font-bold py-8">No stock records found</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {viewMode === 'HISTORY' && (
        <div className="bg-white">
          <h2 className="text-xl font-black uppercase p-4 border-b-2 border-black bg-zinc-50">Stock Movement History</h2>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>User</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((h: any) => (
                  <TableRow key={h.id}>
                    <TableCell>{new Date(h.createdAt).toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={
                          h.type === 'SALE' ? 'success' : 
                          h.type === 'REFUND' ? 'warning' : 'outline'
                      }>
                        {h.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="uppercase font-bold text-xs">{h.sku?.product?.name} ({h.sku?.name || h.sku?.barcode})</TableCell>
                    <TableCell className="font-mono">{h.qty > 0 ? '+' + h.qty : h.qty}</TableCell>
                    <TableCell className="uppercase text-xs">{h.reason || '-'}</TableCell>
                    <TableCell className="font-mono text-xs text-zinc-500">{h.userId || 'SYSTEM'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
