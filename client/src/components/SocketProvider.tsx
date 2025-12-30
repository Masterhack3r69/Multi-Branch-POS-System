import { useEffect, ReactNode } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useSocketStore } from '@/store/socketStore';

interface SocketProviderProps {
  children: ReactNode;
}

const SocketProvider = ({ children }: SocketProviderProps) => {
  const { token } = useAuthStore();
  const { connect, disconnect } = useSocketStore();

  useEffect(() => {
    if (token) {
      connect(token);
    } else {
      disconnect();
    }

    return () => {
      if (token) {
        disconnect();
      }
    };
  }, [token]);

  return <>{children}</>;
};

export default SocketProvider;