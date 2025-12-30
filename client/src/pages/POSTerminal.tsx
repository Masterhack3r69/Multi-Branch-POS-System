import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { db } from '@/lib/db';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';

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

import { CashSessionModal } from '@/components/CashSessionModal';
import { CloseSessionModal } from '@/components/CloseSessionModal';

export function POSTerminal() {
  const { user, logout: globalLogout } = useAuthStore();
  const navigate = useNavigate();
  const [sessionActive, setSessionActive] = useState(false);
  const [showCloseSession, setShowCloseSession] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [stockMap, setStockMap] = useState<Record<string, number>>({});
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);

  const [branchId, setBranchId] = useState<string>('');
  const [terminalId, setTerminalId] = useState<string>('');

  useEffect(() => {
    // Redirect admin users away from terminal
    if (user?.role === 'ADMIN') {
      navigate('/dashboard');
      return;
    }
    
    window.addEventListener('online', () => setOnline(true));
    window.addEventListener('offline', () => setOnline(false));
    
    fetchContext();
    // Check session after user is available
    if (user) {
      checkExistingSession();
    }
    
    return () => {
        window.removeEventListener('online', () => setOnline(true));
        window.removeEventListener('offline', () => setOnline(false));
    };
  }, [user, navigate]); // Check session when user changes

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

  const checkExistingSession = async () => {
    try {
      const res = await api.get('/cash/session');
      if (res.data) {
        console.log('Existing cash session found:', res.data);
        setSessionActive(true);
      } else {
        console.log('No active cash session found');
        setSessionActive(false);
      }
    } catch (err: any) {
      console.log('Session check failed:', err.response?.status || err.message);
      // If 404, it means no session exists (which is expected)
      if (err.response?.status !== 404) {
        console.error('Unexpected error checking session:', err);
      }
      setSessionActive(false);
    }
  };

  const handleLogout = async () => {
    try {
      console.log('Logout initiated, sessionActive:', sessionActive);
      
      // Check if there's an active cash session
      if (sessionActive) {
        console.log('Checking active session before logout...');
        const res = await api.get('/cash/session');
        console.log('Active session response:', res.data);
        
        if (res.data) {
          // Calculate expected cash amount from sales for this session
          console.log('Calculating expected cash amount from sales...');
          const salesResult = await api.get('/cash/sales-for-session', {
            params: { sessionId: res.data.id }
          });
          
          const totalSales = salesResult.data?.totalSales || 0;
          const startAmount = res.data.startAmount || 0;
          const expectedAmount = startAmount + totalSales;
          
          console.log('Session calculations:', {
            startAmount,
            totalSales,
            expectedAmount
          });
          
          // Show confirmation dialog instead of prompt
          const shouldEnd = window.confirm(
            `End Shift Summary:\n\n` +
            `Start Amount: $${startAmount.toFixed(2)}\n` +
            `Sales Total: $${totalSales.toFixed(2)}\n` +
            `Expected in Drawer: $${expectedAmount.toFixed(2)}\n\n` +
            `Click OK to confirm and end shift\n` +
            `Click Cancel to continue working`
          );
          
          if (shouldEnd) {
            try {
              console.log('Ending session with expected amount:', expectedAmount);
              const endResult = await api.post('/cash/session/end', {
                endAmount: expectedAmount
              });
              console.log('Session end result:', endResult.data);
              
              // Reset session state before logout
              setSessionActive(false);
              
              alert('Cash shift ended successfully!\n\n' +
                     `Sales: $${totalSales.toFixed(2)}\n` +
                     `Final Amount: $${expectedAmount.toFixed(2)}`);
            } catch (err: any) {
              console.error('Error ending cash session:', err);
              alert('Failed to end cash session: ' + (err.response?.data?.message || err.message));
              // Still logout even if session end fails
            }
          } else {
            // User cancelled - don't logout
            console.log('User cancelled shift end - continuing work');
            return;
          }
        } else {
          console.log('No active session found during logout check');
        }
      } else {
        console.log('No session active, performing regular logout');
      }
      
      // Perform regular logout
      console.log('Performing global logout');
      globalLogout();
    } catch (err) {
      console.error('Logout error:', err);
      globalLogout();
    }
  };

  const syncPendingSales = async () => {
      if (!online) return;
      const pending = await db.getPendingSales();
      if (pending.length === 0) return;
      
      console.log('Syncing sales...', pending.length);
      for (const sale of pending) {
          try {
              const { synced, clientSaleId, ...payload } = sale; 
              await api.post('/sales', { ...payload, clientSaleId });
              await db.markSaleSynced(clientSaleId);
          } catch (e) {
              console.error('Sync failed for', sale.clientSaleId, e);
          }
      }
      fetchStock();
  };

  const addToCart = (product: Product) => {
    const sku = product.skus[0];
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
    if (!sessionActive) {
      alert('Cash session must be active to complete sales. Please start a session first.');
      return;
    }
    
    setLoading(true);
    const saleData = {
      branchId,
      terminalId,
      cashierId: user?.id,
      items: cart.map(item => ({
        skuId: item.skuId,
        qty: item.qty,
        price: item.price
      })),
      payments: [{
        method: 'CASH',
        amount: total
      }]
    };

    try {
      if (online) {
          await api.post('/sales', saleData);
          alert('Sale completed!');
          fetchStock();
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
    <div className="flex h-[calc(100vh-theme(spacing.16))] gap-6">
      {/* Products Grid */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
                <h1 className="text-2xl font-black uppercase tracking-tighter">Terminal</h1>
                <Badge variant={sessionActive ? 'success' : 'destructive'}>
                   {sessionActive ? 'Session Active' : 'No Session'}
                </Badge>
            </div>
             <div className="flex items-center gap-4">
                 <Badge variant={online ? 'success' : 'destructive'}>
                    {online ? 'System Online' : 'System Offline'}
                 </Badge>
                 {sessionActive && (
                     <button
                         onClick={handleLogout}
                         className="text-red-600 hover:text-red-700 font-bold text-sm uppercase border border-red-600 px-3 py-1"
                     >
                         End Shift
                     </button>
                 )}
             </div>
        </div>
        
        <div className="mb-6">
            <Input
              placeholder="SEARCH SKU / PRODUCT NAME..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
        </div>
        
        <div className="grid grid-cols-3 gap-4 overflow-y-auto pr-2 pb-2">
          {filteredProducts.map((p) => {
            const skuId = p.skus[0]?.id;
            const stockQty = stockMap[skuId] ?? 0;
            const hasStock = stockQty > 0;

            return (
              <div
                key={p.id}
                onClick={() => addToCart(p)}
                className="group border-2 border-black bg-white p-4 cursor-pointer hover:bg-black hover:text-white transition-all active:translate-y-1"
              >
                <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold uppercase text-sm leading-tight">{p.name}</h3>
                    <Badge variant={hasStock ? 'success' : 'destructive'} className="group-hover:bg-white group-hover:text-black group-hover:border-black border">
                       {stockQty}
                    </Badge>
                </div>
                <p className="font-mono text-lg font-bold">${p.price.toFixed(2)}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Cart Section */}
      <div className="w-1/3 flex flex-col border-2 border-black bg-white h-full">
        <div className="p-4 border-b-2 border-black bg-zinc-50">
            <h2 className="font-black uppercase tracking-tight flex justify-between items-center">
                Current Sale
                <Badge variant="default" className="font-mono">{cart.length} ITEMS</Badge>
            </h2>
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-2">
          {cart.map((item) => (
            <div key={item.skuId} className="flex justify-between items-center p-3 border border-black bg-zinc-50 group hover:bg-zinc-100">
              <div>
                <div className="font-bold text-sm uppercase">{item.name}</div>
                <div className="text-xs font-mono text-zinc-500 group-hover:text-zinc-700">
                    ${item.price} x {item.qty}
                </div>
              </div>
              <div className="font-mono font-bold">${(item.price * item.qty).toFixed(2)}</div>
            </div>
          ))}
          {cart.length === 0 && (
              <div className="text-center text-zinc-400 text-xs font-bold uppercase mt-10">
                  Cart is empty
              </div>
          )}
        </div>
        
        <div className="p-4 border-t-2 border-black bg-zinc-50">
          <div className="flex justify-between mb-4 text-xl font-black uppercase tracking-tighter">
            <span>Total</span>
            <span className="font-mono">${total.toFixed(2)}</span>
          </div>
          <Button
            onClick={checkout}
            disabled={cart.length === 0 || loading}
            className="w-full h-14 text-lg"
          >
            {loading ? 'PROCESSING...' : 'COMPLETE SALE'}
          </Button>
        </div>
      </div>

      {/* Session Modals */}
      {!sessionActive && branchId && terminalId && (
          <CashSessionModal 
            branchId={branchId}
            terminalId={terminalId}
            onSessionActive={() => setSessionActive(true)} 
            onLogout={handleLogout}
          />
      )}

      {showCloseSession && (
          <CloseSessionModal 
            onClosed={() => {
                setShowCloseSession(false);
                setSessionActive(false); 
            }}
            onCancel={() => setShowCloseSession(false)}
          />
      )}
    </div>
  );
}
