import { useConnectionStore } from '@/store/connectionStore';
import { useSocketStore } from '@/store/socketStore';

export function ConnectionStatus() {
  const { status, lastConnected, reconnectAttempts, maxReconnectAttempts } = useConnectionStore();
  const { error } = useSocketStore();

  const getStatusColor = () => {
    switch (status) {
      case 'connected': return 'text-green-600 bg-green-50';
      case 'connecting': return 'text-blue-600 bg-blue-50';
      case 'reconnecting': return 'text-orange-600 bg-orange-50';
      case 'error': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'connected': return 'CONNECTED';
      case 'connecting': return 'CONNECTING...';
      case 'reconnecting': return `RECONNECTING (${reconnectAttempts}/${maxReconnectAttempts})`;
      case 'error': return 'CONNECTION ERROR';
      default: return 'DISCONNECTED';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'connected': return '●';
      case 'connecting': return '○';
      case 'reconnecting': return '◐';
      case 'error': return '●';
      default: return '○';
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className={`text-xs font-mono font-bold px-2 py-1 rounded ${getStatusColor()}`}>
        {getStatusIcon()} {getStatusText()}
      </span>
      {lastConnected && (
        <span className="text-xs text-gray-500 font-mono">
          Last: {new Date(lastConnected).toLocaleTimeString()}
        </span>
      )}
      {error && (
        <span className="text-xs text-red-600 max-w-xs truncate">
          {error}
        </span>
      )}
    </div>
  );
}