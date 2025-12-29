import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

interface CashSessionModalProps {
  onSessionActive: () => void;
  onLogout: () => void;
  branchId?: string;
  terminalId?: string;
}

export function CashSessionModal({ onSessionActive, onLogout, branchId, terminalId }: CashSessionModalProps) {
  const { user } = useAuthStore();
  const [startAmount, setStartAmount] = useState('0');
  const [error, setError] = useState('');
  const [step, setStep] = useState<'LOADING' | 'START' | 'ACTIVE'>('LOADING');

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const res = await api.get('/cash/session');
      if (res.data) {
        setStep('ACTIVE');
        onSessionActive();
      } else {
        setStep('START');
      }
    } catch (err) {
      console.error(err);
      // If 404 or null, valid state -> START
      setStep('START');
    }
  };

  const handleStartSession = async () => {
    try {
      const targetBranchId = branchId || user?.branchId;
      
      if (!targetBranchId) {
        setError("No branch selected. Contact Admin.");
        return;
      }
      
      let targetTerminalId = terminalId;

      // If no terminal passed, try to fetch default
      if (!targetTerminalId) {
          const termRes = await api.get(`/branches/${targetBranchId}/terminals`);
          const terminals = termRes.data;
          if (!terminals || terminals.length === 0) {
              setError("No terminals found for this branch.");
              return;
          }
          targetTerminalId = terminals[0].id;
      }

      await api.post('/cash/session/start', {
        branchId: targetBranchId,
        terminalId: targetTerminalId, 
        startAmount: parseFloat(startAmount) || 0
      });
      
      checkSession();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error starting session');
    }
  };

  if (step === 'LOADING') {
    return (
      <div className="fixed inset-0 bg-gray-900 bg-opacity-90 flex items-center justify-center z-9999 text-white">
        Checking Cash Drawer Status...
      </div>
    );
  }

  // If active, we don't show modal, or we render nothing (parent controls visibility)
  // But wait, this modal works as a blocker. 
  if (step === 'ACTIVE') {
      return null;
  }

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-90 flex items-center justify-center z-9999">
      <div className="bg-white text-gray-900 p-8 rounded-lg shadow-xl max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4">Open Cash Drawer</h2>
        <p className="mb-4 text-gray-600">A cash session must be started before making sales.</p>
        
        {error && <div className="p-2 mb-4 bg-red-100 text-red-700 rounded">{error}</div>}

        <div className="mb-6">
          <label className="block text-sm font-medium mb-1">Starting Cash Float ($)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            className="w-full text-2xl p-2 border rounded"
            value={startAmount}
            onChange={(e) => setStartAmount(e.target.value)}
          />
        </div>

        <div className="flex justify-between">
            <button 
                onClick={onLogout}
                className="text-gray-500 hover:text-gray-700"
            >
                Logout
            </button>
            <button
                onClick={handleStartSession}
                className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 text-lg font-bold"
            >
                Open Drawer
            </button>
        </div>
      </div>
    </div>
  );
}
