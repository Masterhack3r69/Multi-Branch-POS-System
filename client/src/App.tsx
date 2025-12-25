import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from '@/pages/Login';
import { useAuthStore } from '@/store/authStore';
import { POSTerminal } from '@/pages/POSTerminal';

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
              <POSTerminal />
            </PrivateRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
