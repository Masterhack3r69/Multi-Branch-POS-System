import { useEffect } from 'react';
import { useSocketStore } from '@/store/socketStore';

export const useSocket = () => {
  const { socket, isConnected, isConnecting, error, connect, disconnect } = useSocketStore();

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (socket?.connected) {
        disconnect();
      }
    };
  }, []);

  const emit = (event: string, data?: any) => {
    if (socket?.connected) {
      socket.emit(event, data);
    } else {
      console.warn('Socket not connected, cannot emit event:', event);
    }
  };

  const on = (event: string, callback: (...args: any[]) => void) => {
    if (socket) {
      socket.on(event, callback);
      
      // Return cleanup function
      return () => {
        socket.off(event, callback);
      };
    }
  };

  const off = (event: string, callback?: (...args: any[]) => void) => {
    if (socket) {
      socket.off(event, callback);
    }
  };

  return {
    socket,
    isConnected,
    isConnecting,
    error,
    connect,
    disconnect,
    emit,
    on,
    off
  };
};