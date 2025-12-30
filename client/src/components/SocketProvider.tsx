import { useEffect, ReactNode } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useSocketStore } from '@/store/socketStore';

interface SocketProviderProps {
  children: ReactNode;
}

const SocketProvider = ({ children }: SocketProviderProps) => {
  const { token } = useAuthStore();

  useEffect(() => {
    const { connect, disconnect, isConnected } = useSocketStore.getState();

    if (token) {
      // Only connect if not already connected
      if (!isConnected) {
        connect(token);
      }
    } else {
      // Disconnect if no token
      disconnect();
    }
    
    // Do NOT cleanup on unmount - keep connection alive
    // Only cleanup when token changes
  }, [token]);

  return <>{children}</>;
};

export default SocketProvider;