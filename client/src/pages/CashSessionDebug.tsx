import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

export function CashSessionDebug() {
  const { user } = useAuthStore();
  const [debugInfo, setDebugInfo] = useState<any>(null);

  const checkSession = async () => {
    try {
      console.log('=== Checking Cash Session ===');
      const res = await api.get('/cash/session');
      console.log('Session API response:', res);
      setDebugInfo({
        sessionData: res.data,
        user: user,
        timestamp: new Date().toISOString()
      });
    } catch (err: any) {
      console.error('Session check error:', err);
      setDebugInfo({
        error: err.response?.data || err.message,
        status: err.response?.status,
        user: user,
        timestamp: new Date().toISOString()
      });
    }
  };

  const startTestSession = async () => {
    try {
      console.log('=== Starting Test Session ===');
      const result = await api.post('/cash/session/start', {
        branchId: user?.branchId,
        terminalId: 'test-terminal-id',
        startAmount: 100.00
      });
      console.log('Start session result:', result);
      checkSession();
    } catch (err: any) {
      console.error('Start session error:', err);
      setDebugInfo({
        startError: err.response?.data || err.message,
        status: err.response?.status
      });
    }
  };

  const endTestSession = async () => {
    try {
      console.log('=== Ending Test Session ===');
      const result = await api.post('/cash/session/end', {
        endAmount: 150.00
      });
      console.log('End session result:', result);
      checkSession();
    } catch (err: any) {
      console.error('End session error:', err);
      setDebugInfo({
        endError: err.response?.data || err.message,
        status: err.response?.status
      });
    }
  };

  useEffect(() => {
    if (user) {
      checkSession();
    }
  }, [user]);

  if (!user) {
    return <div className="p-4">Please log in first</div>;
  }

  return (
    <div className="p-6 max-w-2xl mx-auto bg-white border-2 border-black">
      <h2 className="text-2xl font-black mb-4">Cash Session Debug</h2>
      
      <div className="space-y-4">
        <div className="border p-4">
          <h3 className="font-bold mb-2">User Info</h3>
          <pre className="text-xs bg-gray-100 p-2">
            {JSON.stringify(user, null, 2)}
          </pre>
        </div>

        <div className="border p-4">
          <h3 className="font-bold mb-2">Actions</h3>
          <div className="flex gap-2">
            <button 
              onClick={checkSession}
              className="bg-blue-600 text-white px-4 py-2"
            >
              Check Session
            </button>
            <button 
              onClick={startTestSession}
              className="bg-green-600 text-white px-4 py-2"
            >
              Start Test Session
            </button>
            <button 
              onClick={endTestSession}
              className="bg-red-600 text-white px-4 py-2"
            >
              End Test Session
            </button>
          </div>
        </div>

        {debugInfo && (
          <div className="border p-4">
            <h3 className="font-bold mb-2">Debug Info</h3>
            <pre className="text-xs bg-gray-100 p-2 whitespace-pre-wrap">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}