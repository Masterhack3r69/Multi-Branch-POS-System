import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { db } from '@/lib/db';

interface Product {
  id: string;
  name: string;
  price: number;
  skus: { id: string; barcode: string | null }[];
}

interface CartItem {
  skuId: string;
  name: string;
  price: number;
  qty: number;
}

export function POSTerminal() {
  const { user, logout } = useAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [stockMap, setStockMap] = useState<Record<string, number>>({});
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);

  // Need to select terminal context. For MVP, we'll auto-select the first one available or prompt.
  // We'll fetch branches/terminals on mount.
  const [branchId, setBranchId] = useState<string>('');
  const [terminalId, setTerminalId] = useState<string>('');

  useEffect(() => {
    window.addEventListener('online', () => setOnline(true));
    window.addEventListener('offline', () => setOnline(false));
    
    fetchContext(); // This sets branchId
    
    return () => {
        window.removeEventListener('online', () => setOnline(true));
        window.removeEventListener('offline', () => setOnline(false));
    };
  }, [online]);

  useEffect(() => {
    if (branchId) {
        fetchProducts();
        fetchStock();
        syncPendingSales();
    }
  }, [branchId, online]);

  const fetchContext = async () => {
    try {
      if (online) {
          const bRes = await api.get('/branches');
          if (bRes.data.length > 0) {
            // Priority: User's assigned branch -> First available branch
            // In a real app, we'd persist the selected terminal/branch in local storage
            const targetBranch = user?.branchId || bRes.data[0].id;
            setBranchId(targetBranch);
            
            const tRes = await api.get(`/branches/${targetBranch}/terminals`);
            if (tRes.data.length > 0) setTerminalId(tRes.data[0].id);
          }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchProducts = async () => {
    try {
      if (online) {
          const res = await api.get('/products');
          setProducts(res.data);
          await db.saveProducts(res.data);
      } else {
          const cached = await db.getProducts();
          setProducts(cached);
      }
    } catch (e) {
      console.error('Fetch products failed, using cache', e);
      const cached = await db.getProducts();
      setProducts(cached);
    }
  };
  
  const fetchStock = async () => {
      if (!online || !branchId) return;
      try {
          const res = await api.get('/inventory/levels', { params: { branchId } });
          const map: Record<string, number> = {};
          res.data.forEach((s: any) => {
              map[s.skuId] = s.qty;
          });
          setStockMap(map);
      } catch (e) {
          console.error('Error fetching stock', e);
      }
  };

  const syncPendingSales = async () => {
      if (!online) return;
      const pending = await db.getPendingSales();
      if (pending.length === 0) return;
      
      console.log('Syncing sales...', pending.length);
      for (const sale of pending) {
          try {
              // Remove extra fields before sending
              const { synced, clientSaleId, ...payload } = sale; 
              await api.post('/sales', { ...payload, clientSaleId });
              await db.markSaleSynced(clientSaleId);
          } catch (e) {
              console.error('Sync failed for', sale.clientSaleId, e);
          }
      }
      console.log('Sync complete');
      fetchStock(); // Refresh stock after sync
  };

  const addToCart = (product: Product) => {
    const sku = product.skus[0]; // Default SKU
    setCart((prev) => {
      const existing = prev.find((item) => item.skuId === sku.id);
      if (existing) {
        return prev.map((item) =>
          item.skuId === sku.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prev, { skuId: sku.id, name: product.name, price: product.price, qty: 1 }];
    });
  };

  const checkout = async () => {
    if (!branchId || !terminalId) return alert('No terminal selected');
    setLoading(true);
    
    const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    const clientSaleId = crypto.randomUUID();
    
    const saleData = {
      clientSaleId,
      branchId,
      terminalId,
      cashierId: user?.id,
      items: cart.map(item => ({ skuId: item.skuId, qty: item.qty, price: item.price })),
      payments: [{ method: 'CASH', amount: total * 1.1 }] // Auto-calc tax/payment for MVP speed
    };

    try {
      if (online) {
          await api.post('/sales', saleData);
          alert('Sale completed!');
          fetchStock(); // Refresh stock immediately
      } else {
          await db.queueSale(saleData);
          alert('Sale queued (Offline)');
      }
      setCart([]);
    } catch (e) {
      alert('Sale failed');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar / Products */}
      <div className="flex-1 p-4 overflow-auto">
        <div className="flex justify-between mb-4">
            <h1 className="text-2xl font-bold">POS - {user?.name}</h1>
            <div className="space-x-4">
                 <span className={`px-2 py-1 rounded text-xs ${online ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {online ? 'Online' : 'Offline'}
                 </span>
                 <button onClick={logout} className="text-red-500">Logout</button>
            </div>
        </div>
        
        <input
          className="w-full p-2 mb-4 border rounded"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        
        <div className="grid grid-cols-3 gap-4">
          {filteredProducts.map((p) => {
            const skuId = p.skus[0]?.id;
            const stockQty = stockMap[skuId] ?? 0; // Default to 0 if unknown
            const hasStock = stockQty > 0;

            return (
              <div
                key={p.id}
                onClick={() => addToCart(p)}
                className={`p-4 bg-white rounded shadow cursor-pointer hover:bg-blue-50 relative border-l-4 ${hasStock ? 'border-green-500' : 'border-red-500'}`}
              >
                <div className="flex justify-between items-start">
                    <h3 className="font-bold">{p.name}</h3>
                    <span className={`text-xs font-bold px-2 py-1 rounded ${hasStock ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {stockQty} left
                    </span>
                </div>
                <p className="text-gray-600">${p.price.toFixed(2)}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Cart */}
      <div className="flex flex-col w-1/3 p-4 bg-white shadow-l">
        <h2 className="mb-4 text-xl font-bold">Current Sale</h2>
        <div className="flex-1 overflow-auto">
          {cart.map((item) => (
            <div key={item.skuId} className="flex justify-between py-2 border-b">
              <div>
                <div className="font-medium">{item.name}</div>
                <div className="text-sm text-gray-500">${item.price} x {item.qty}</div>
              </div>
              <div className="font-bold">${(item.price * item.qty).toFixed(2)}</div>
            </div>
          ))}
        </div>
        
        <div className="pt-4 mt-4 border-t">
          <div className="flex justify-between mb-2 text-xl font-bold">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
          <button
            onClick={checkout}
            disabled={cart.length === 0 || loading}
            className="w-full py-3 text-white bg-green-600 rounded disabled:bg-gray-400 hover:bg-green-700"
          >
            {loading ? 'Processing...' : 'Checkout (Cash)'}
          </button>
        </div>
      </div>
    </div>
  );
}
