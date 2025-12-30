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
    const { socket } = get();
    const { setStatus } = useConnectionStore.getState();
    
    if (socket?.connected) {
      console.log('Socket already connected');
      return;
    }

    set({ isConnecting: true, error: null, token });
    setStatus('connecting');
    
    // Update realtime store
    import('./realtimeStore').then(({ useRealtimeStore }) => {
      useRealtimeStore.getState().setConnectionStatus('connecting');
    });

    try {
      // Dynamic import to avoid SSR issues
      import('socket.io-client').then(({ io }) => {
        const newSocket = io('http://localhost:3000', {
          auth: { token },
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
        });

        newSocket.on('connect', () => {
          console.log('Connected to WebSocket server');
          set({ isConnected: true, isConnecting: false, error: null });
          
          // Update connection stores
          import('./realtimeStore').then(({ useRealtimeStore }) => {
            useRealtimeStore.getState().setConnectionStatus('connected');
          });
          
          const { setStatus, resetReconnectAttempts } = useConnectionStore.getState();
          setStatus('connected');
          resetReconnectAttempts();
        });

        newSocket.on('disconnect', (reason: string) => {
          console.log('Disconnected from WebSocket server:', reason);
          set({ isConnected: false, isConnecting: false });
          
          // Update connection stores
          import('./realtimeStore').then(({ useRealtimeStore }) => {
            useRealtimeStore.getState().setConnectionStatus('disconnected');
          });
          
          const { setStatus } = useConnectionStore.getState();
          setStatus('disconnected');
        });

        newSocket.on('connect_error', (error: Error) => {
          console.error('WebSocket connection error:', error);
          set({ 
            error: 'Failed to connect to server', 
            isConnecting: false 
          });
          
          // Update connection stores
          import('./realtimeStore').then(({ useRealtimeStore }) => {
            useRealtimeStore.getState().setConnectionStatus('error');
          });
          
          const { setStatus, incrementReconnectAttempts, getReconnectDelay } = useConnectionStore.getState();
          setStatus('error');
          incrementReconnectAttempts();
          
          // Attempt reconnection if within limits
          const reconnectDelay = getReconnectDelay();
          setTimeout(() => {
            const currentState = get();
            if (currentState.token) {
              console.log(`Attempting reconnection in ${reconnectDelay}ms...`);
              currentState.connect(currentState.token);
            }
          }, reconnectDelay);
        });

        set({ socket: newSocket });
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
    if (socket) {
      socket.disconnect();
      set({ 
        socket: null, 
        isConnected: false, 
        error: null,
        token: null
      });
    }
  },

  setError: (error: string | null) => {
    set({ error });
  }
}));