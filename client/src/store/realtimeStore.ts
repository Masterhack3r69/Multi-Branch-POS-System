import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface RealtimeState {
  lastUpdate: number | null;
  isConnected: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  newSalesCount: number;
  notifications: Array<{
    id: string;
    type: 'sale' | 'stock' | 'system';
    message: string;
    timestamp: number;
    read: boolean;
  }>;
  
  setConnectionStatus: (status: 'connecting' | 'connected' | 'disconnected' | 'error') => void;
  incrementNewSales: () => void;
  resetNewSales: () => void;
  addNotification: (notification: Omit<RealtimeState['notifications'][0], 'id' | 'timestamp' | 'read'>) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
}

export const useRealtimeStore = create<RealtimeState>()(
  persist(
    (set) => ({
      lastUpdate: null,
      isConnected: false,
      connectionStatus: 'disconnected',
      newSalesCount: 0,
      notifications: [],

      setConnectionStatus: (status) => {
        const isConnected = status === 'connected';
        set({ 
          connectionStatus: status,
          isConnected,
          lastUpdate: isConnected ? Date.now() : null
        });
      },

      incrementNewSales: () => {
        set((state) => ({
          newSalesCount: state.newSalesCount + 1
        }));
      },

      resetNewSales: () => {
        set({ newSalesCount: 0 });
      },

      addNotification: (notification) => {
        const newNotification = {
          ...notification,
          id: Date.now().toString(),
          timestamp: Date.now(),
          read: false
        };

        set((state) => ({
          notifications: [newNotification, ...state.notifications].slice(0, 50) // Keep last 50
        }));
      },

      markNotificationRead: (id) => {
        set((state) => ({
          notifications: state.notifications.map(n => 
            n.id === id ? { ...n, read: true } : n
          )
        }));
      },

      clearNotifications: () => {
        set({ notifications: [] });
      }
    }),
    {
      name: 'realtime-storage',
      partialize: (state) => ({ 
        notifications: state.notifications.slice(0, 20), // Only persist recent notifications
        newSalesCount: state.newSalesCount
      })
    }
  )
);