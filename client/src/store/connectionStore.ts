import { create } from 'zustand';

interface ConnectionState {
  status: 'connecting' | 'connected' | 'disconnected' | 'error' | 'reconnecting';
  lastConnected: number | null;
  reconnectAttempts: number;
  maxReconnectAttempts: number;
  
  setStatus: (status: 'connecting' | 'connected' | 'disconnected' | 'error' | 'reconnecting') => void;
  setLastConnected: (timestamp: number | null) => void;
  incrementReconnectAttempts: () => void;
  resetReconnectAttempts: () => void;
  getReconnectDelay: () => number;
}

export const useConnectionStore = create<ConnectionState>((set, get) => ({
  status: 'disconnected',
  lastConnected: null,
  reconnectAttempts: 0,
  maxReconnectAttempts: 5,

  setStatus: (status) => {
    set({ status });
    
    if (status === 'connected') {
      set({ 
        lastConnected: Date.now(), 
        reconnectAttempts: 0 
      });
    }
  },

  setLastConnected: (timestamp) => {
    set({ lastConnected: timestamp });
  },

  incrementReconnectAttempts: () => {
    const { reconnectAttempts, maxReconnectAttempts } = get();
    if (reconnectAttempts < maxReconnectAttempts) {
      set({ reconnectAttempts: reconnectAttempts + 1 });
    }
  },

  resetReconnectAttempts: () => {
    set({ reconnectAttempts: 0 });
  },

  getReconnectDelay: () => {
    const { reconnectAttempts } = get();
    // Exponential backoff: 1s, 2s, 4s, 8s, 16s
    return Math.min(1000 * Math.pow(2, reconnectAttempts), 16000);
  }
}));