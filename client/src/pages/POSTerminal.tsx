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
    
    fetchContext();
    fetchProducts();
    syncPendingSales();

    return () => {
        window.removeEventListener('online', () => setOnline(true));
        window.removeEventListener('offline', () => setOnline(false));
    };
  }, [online]);

  const fetchContext = async () => {
    try {
      if (online) {
          const bRes = await api.get('/branches');
          if (bRes.data.length > 0) {
            setBranchId(bRes.data[0].id);
            const tRes = await api.get(`/branches/${bRes.data[0].id}/terminals`);
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
            <button onClick={logout} className="text-red-500">Logout</button>
        </div>
        
        <input
          className="w-full p-2 mb-4 border rounded"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        
        <div className="grid grid-cols-3 gap-4">
          {filteredProducts.map((p) => (
            <div
              key={p.id}
              onClick={() => addToCart(p)}
              className="p-4 bg-white rounded shadow cursor-pointer hover:bg-blue-50"
            >
              <h3 className="font-bold">{p.name}</h3>
              <p className="text-gray-600">${p.price.toFixed(2)}</p>
            </div>
          ))}
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
