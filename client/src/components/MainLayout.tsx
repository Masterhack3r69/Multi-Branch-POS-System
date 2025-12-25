import { Link, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

export function MainLayout() {
  const { user, logout } = useAuthStore();

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <nav className="bg-blue-600 text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <div className="text-xl font-bold">POS System</div>
          <div className="space-x-4">
            <Link to="/" className="hover:underline">POS Terminal</Link>
            <Link to="/sales" className="hover:underline">Sales History</Link>
            {(user?.role === 'MANAGER' || user?.role === 'ADMIN') && (
              <Link to="/inventory" className="hover:underline">Inventory</Link>
            )}
            <button onClick={logout} className="bg-red-500 px-3 py-1 rounded hover:bg-red-600">Logout</button>
          </div>
        </div>
      </nav>
      <main className="flex-grow container mx-auto p-4">
        <Outlet />
      </main>
    </div>
  );
}
