import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

interface CloseSessionModalProps {
  onClosed: () => void;
  onCancel: () => void;
}

export function CloseSessionModal({ onClosed, onCancel }: CloseSessionModalProps) {
  const [session, setSession] = useState<any>(null);
  const [endAmount, setEndAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSession();
  }, []);

  const fetchSession = async () => {
    try {
      const res = await api.get('/cash/session');
      setSession(res.data);
    } catch (err) {
      console.error(err);
      setError('Could not fetch session details');
    } finally {
      setLoading(false);
    }
  };

  const handleEndSession = async () => {
    try {
      await api.post('/cash/session/end', {
        endAmount: parseFloat(endAmount) || 0
      });
      onClosed();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error ending session');
    }
  };

  if (loading) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-90 flex items-center justify-center z-9999">
      <div className="bg-white text-gray-900 p-8 rounded-lg shadow-xl max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4">Close Cash Drawer</h2>
        
        {error && <div className="p-2 mb-4 bg-red-100 text-red-700 rounded">{error}</div>}

        {session && (
            <div className="mb-4 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                <p>Started: {new Date(session.startTime).toLocaleString()}</p>
                <p>Starting Float: ${session.startAmount?.toFixed(2)}</p>
                {/* Expected amount is calculated on backend usually, simple frontend calc could be done here if we wanted */}
            </div>
        )}

        <div className="mb-6">
          <label className="block text-sm font-medium mb-1">Ending Cash Count ($)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            className="w-full text-2xl p-2 border rounded"
            value={endAmount}
            onChange={(e) => setEndAmount(e.target.value)}
            placeholder="0.00"
          />
        </div>

        <div className="flex justify-end space-x-2">
            <button 
                onClick={onCancel}
                className="px-4 py-2 border rounded hover:bg-gray-50"
            >
                Cancel
            </button>
            <button
                onClick={handleEndSession}
                className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700 font-bold"
            >
                End Session
            </button>
        </div>
      </div>
    </div>
  );
}
