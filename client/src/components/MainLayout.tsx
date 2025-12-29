import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

export function MainLayout() {
  const { user, logout } = useAuthStore();
  const location = useLocation();

  const getLinkClass = (path: string) => {
    const isActive = location.pathname === path;
    return isActive 
        ? "bg-black text-white px-2 py-1 transition-colors" 
        : "text-zinc-400 hover:text-black hover:bg-black/5 px-2 py-1 transition-colors";
  };

  return (
    <div className="min-h-screen bg-white font-mono text-zinc-900 flex flex-col">
      {/* Heavy Border Top Nav */}
      <nav className="h-14 border-b-2 border-black flex items-center justify-between px-6 bg-white sticky top-0 z-50">
          <div className="flex items-center gap-8">
              <div className="font-black text-xl tracking-tighter uppercase">POS.SYSTEM</div>
              <div className="hidden md:flex gap-6 text-sm font-bold uppercase tracking-wide">
                  {user?.role === 'ADMIN' && (
                      <Link to="/dashboard" className={getLinkClass('/dashboard')}>Dashboard</Link>
                  )}
                  {user?.role !== 'ADMIN' && (
                    <Link to="/" className={getLinkClass('/')}>Terminal</Link>
                  )}
                  <Link to="/sales" className={getLinkClass('/sales')}>Sales</Link>
                  {['ADMIN', 'MANAGER'].includes(user?.role || '') && (
                    <>
                      <Link to="/products" className={getLinkClass('/products')}>Products</Link>
                      <Link to="/inventory" className={getLinkClass('/inventory')}>Inventory</Link>
                    </>
                  )}
                  {user?.role === 'ADMIN' && (
                     <>
                        <Link to="/users" className={getLinkClass('/users')}>Users</Link>
                        <Link to="/branches" className={getLinkClass('/branches')}>Branches</Link>
                     </>
                  )}
              </div>
          </div>
          <div className="flex items-center gap-4">
              <div className="flex items-center border border-black px-2 py-1 bg-zinc-50">
                  <span className="text-xs text-zinc-500 mr-2">USER</span>
                  <span className="text-sm font-bold uppercase">{user?.name}</span>
              </div>
              <button 
                onClick={logout}
                className="h-8 px-4 bg-black text-white flex items-center justify-center font-bold text-xs uppercase hover:bg-zinc-800 transition-colors"
              >
                  Logout
              </button>
          </div>
      </nav>

      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
            <Outlet />
        </div>
      </main>
    </div>
  );
}
