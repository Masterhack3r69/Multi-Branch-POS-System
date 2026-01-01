import { create } from 'zustand';
import { useConnectionStore } from './connectionStore';

interface SocketState {
  socket: any;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  token: string | null;
  connect: (token: string) => void;
  disconnect: () => void;
  setError: (error: string | null) => void;
}

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  isConnected: false,
  isConnecting: false,
  error: null,
  token: null,

  connect: (token: string) => {
    const currentState = get();
    
    // If already connecting or connected, don't reconnect
    if (currentState.isConnecting || currentState.isConnected) {
      console.log('Socket already connecting or connected, skipping');
      return;
    }

    // If socket exists and is connected, don't reconnect
    if (currentState.socket?.connected) {
      console.log('Socket already connected, updating state');
      set({ isConnected: true, isConnecting: false, token });
      return;
    }

    set({ isConnecting: true });
    console.log('Starting socket connection...');
    
    // Update realtime store
    import('./realtimeStore').then(({ useRealtimeStore }) => {
      useRealtimeStore.getState().setConnectionStatus('connecting');
    });

    try {
      // Dynamic import to avoid SSR issues
      import('socket.io-client').then(({ io }) => {
        const apiUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000';
        const newSocket = io(apiUrl, {
          auth: { token },
          transports: ['websocket', 'polling'],
          reconnection: false, // Disable auto-reconnect to prevent infinite loop
        });

        newSocket.on('connect', () => {
          console.log('✅ Connected to WebSocket server');
          set({ isConnected: true, isConnecting: false, error: null, socket: newSocket, token });
          
          // Update connection stores
          import('./realtimeStore').then(({ useRealtimeStore }) => {
            useRealtimeStore.getState().setConnectionStatus('connected');
          });
          
          const { setStatus, resetReconnectAttempts } = useConnectionStore.getState();
          setStatus('connected');
          resetReconnectAttempts();
        });

        newSocket.on('disconnect', (reason: string) => {
          console.log('❌ Disconnected from WebSocket server:', reason);
          set({ isConnected: false, isConnecting: false });
          
          // Update connection stores
          import('./realtimeStore').then(({ useRealtimeStore }) => {
            useRealtimeStore.getState().setConnectionStatus('disconnected');
          });
          
          const { setStatus } = useConnectionStore.getState();
          setStatus('disconnected');
        });

        newSocket.on('connect_error', (error: Error) => {
          console.error('⚠️ WebSocket connection error:', error.message);
          
          // Handle authentication errors
          if (error.message === 'Invalid authentication token' || 
              error.message === 'Authentication token required' ||
              error.message === 'xhr poll error') { // Sometimes explicit auth errors are masked in polling
            console.log('Authentication failed, logging out...');
            import('./authStore').then(({ useAuthStore }) => {
              useAuthStore.getState().logout();
              // Force reload to clear any stale state/sockets
              window.location.href = '/login';
            });
            return;
          }

          set({ 
            error: 'Failed to connect to server', 
            isConnecting: false
          });
          
          // Update connection stores
          import('./realtimeStore').then(({ useRealtimeStore }) => {
            useRealtimeStore.getState().setConnectionStatus('error');
          });
          
          const { setStatus } = useConnectionStore.getState();
          setStatus('error');
        });

        set({ socket: newSocket, token });
      }).catch(error => {
        console.error('Failed to import socket.io-client:', error);
        set({ 
          error: 'WebSocket not available', 
          isConnecting: false
        });
      });
    } catch (error) {
      set({ 
        error: 'Failed to initialize WebSocket', 
        isConnecting: false 
      });
    }
  },

  disconnect: () => {
    const { socket } = get();
    console.log('Disconnecting socket...');
    if (socket) {
      socket.removeAllListeners(); // Remove all event listeners
      socket.disconnect();
    }
    set({ 
      socket: null, 
      isConnected: false, 
      isConnecting: false,
      error: null,
      token: null
    });
  },

  setError: (error: string | null) => {
    set({ error });
  }
}));