import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Dashboard } from '@/pages/Dashboard';
import { ManagerDashboard } from '@/pages/ManagerDashboard';

export function RoleBasedDashboard() {
  const { user } = useAuthStore();
  
  // Show admin dashboard for admins, manager dashboard for managers
  if (user?.role === 'ADMIN') {
    return <Dashboard />;
  } else if (user?.role === 'MANAGER') {
    return <ManagerDashboard />;
  } else {
    // For cashiers or other roles, redirect to POS terminal
    return <Navigate to="/terminal" replace />;
  }
}