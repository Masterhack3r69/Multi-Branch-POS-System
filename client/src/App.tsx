import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from '@/pages/Login';
import { useAuthStore } from '@/store/authStore';
import { POSTerminal } from '@/pages/POSTerminal';
import { MainLayout } from '@/components/MainLayout';
import { Inventory } from '@/pages/Inventory';
import { SalesHistory } from '@/pages/SalesHistory';
import { Users } from '@/pages/Users';
import { Branches } from '@/pages/Branches';
import { RoleBasedDashboard } from '@/components/RoleBasedDashboard';
import { CashManagement } from '@/pages/CashManagement';
import { CashSessionDebug } from '@/pages/CashSessionDebug';
import { Reports } from '@/pages/Reports';
import { Products } from '@/pages/Products';
import SocketProvider from '@/components/SocketProvider';

// Component to handle initial redirect after login
function HomeRedirect() {
  const { user } = useAuthStore();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // Admin and managers go to dashboard, cashiers to POS
  if (['ADMIN', 'MANAGER'].includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  } else {
    return <Navigate to="/terminal" replace />;
  }
}


function PrivateRoute({ children }: { children: JSX.Element }) {
  const token = useAuthStore((state) => state.token);
  return token ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <Router>
      <SocketProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <MainLayout />
              </PrivateRoute>
            }
          >
            <Route index element={<HomeRedirect />} />
            <Route path="terminal" element={<POSTerminal />} />
            <Route path="dashboard" element={<RoleBasedDashboard />} />
            <Route path="sales" element={<SalesHistory />} />
            <Route path="products" element={<Products />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="users" element={<Users />} />
            <Route path="branches" element={<Branches />} />
            <Route path="reports" element={<Reports />} />
            <Route path="cash-management" element={<CashManagement />} />
            <Route path="debug-cash" element={<CashSessionDebug />} />
          </Route>
        </Routes>
      </SocketProvider>
    </Router>
  );
}

export default App;
