import { useState } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useNavigate } from 'react-router-dom';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const setAuth = useAuthStore((state) => state.setAuth);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/login', { email, password });
      setAuth(res.data.user, res.data.token);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-12 text-center">
            <h1 className="text-5xl font-mono text-white tracking-tighter mb-2">POS.</h1>
            <p className="text-zinc-500 text-sm tracking-widest uppercase">System Access</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-900/20 border-l-2 border-red-600 text-red-500 text-sm font-mono">
            ERROR: {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1">
            <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider">Email Address</label>
            <input
              type="email"
              className="block w-full bg-zinc-900 border-l-2 border-zinc-700 text-white py-4 px-4 placeholder-zinc-600 focus:outline-none focus:border-white transition-colors"
              placeholder="user@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider">Password</label>
            <input
              type="password"
              className="block w-full bg-zinc-900 border-l-2 border-zinc-700 text-white py-4 px-4 placeholder-zinc-600 focus:outline-none focus:border-white transition-colors"
              placeholder="••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-white text-black font-bold py-4 uppercase tracking-widest hover:bg-zinc-200 transition-colors mt-8"
          >
            Enter System
          </button>
        </form>
         <div className="mt-12 text-center text-xs text-zinc-800 uppercase tracking-widest">
             System v1.0.0
          </div>
      </div>
    </div>
  );
}
