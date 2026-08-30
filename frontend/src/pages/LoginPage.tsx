import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, LogIn, Sparkles } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, loading } = useAuth();
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      await login(email, password);
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Login failed. Please check credentials.';
      setError(msg);
    }
  };

  const autofillDemo = () => {
    setEmail('admin@example.com');
    setPassword('password123');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Subtle Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-8 relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex p-3 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-500/30 mb-3">
            <Mail className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Outbox Scheduler</h1>
          <p className="text-sm text-slate-500 mt-1">Sign in to manage & schedule email jobs</p>
        </div>

        {/* Demo Account Callout Banner */}
        <div
          onClick={autofillDemo}
          className="mb-6 p-3.5 bg-blue-50 border border-blue-200 rounded-xl cursor-pointer hover:bg-blue-100/70 transition flex items-start gap-3 group"
        >
          <Sparkles className="w-5 h-5 text-blue-600 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
          <div className="text-xs">
            <span className="font-semibold text-blue-900 block mb-0.5">Demo Credentials</span>
            <span className="text-blue-700">Email: <code className="font-mono bg-blue-100 px-1 py-0.5 rounded">admin@example.com</code></span>
            <br />
            <span className="text-blue-700">Password: <code className="font-mono bg-blue-100 px-1 py-0.5 rounded">password123</code></span>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-sm rounded-lg shadow-md shadow-blue-500/20 transition flex items-center justify-center gap-2"
          >
            <LogIn className="w-4 h-4" />
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};
