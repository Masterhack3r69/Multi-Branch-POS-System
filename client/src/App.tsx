import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from '@/pages/Login';
import { useAuthStore } from '@/store/authStore';
import { POSTerminal } from '@/pages/POSTerminal';
import { MainLayout } from '@/components/MainLayout';
import { Inventory } from '@/pages/Inventory';
import { SalesHistory } from '@/pages/SalesHistory';
import { Users } from '@/pages/Users';
import { Branches } from '@/pages/Branches';

import { Products } from '@/pages/Products';


function PrivateRoute({ children }: { children: JSX.Element }) {
  const token = useAuthStore((state) => state.token);
  return token ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <Router>
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
          <Route index element={<POSTerminal />} />
          <Route path="sales" element={<SalesHistory />} />
          <Route path="products" element={<Products />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="users" element={<Users />} />
          <Route path="branches" element={<Branches />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
