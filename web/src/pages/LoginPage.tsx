import React, { useState } from 'react';
import { ArrowRight, Lock, Mail } from 'lucide-react';

interface LoginPageProps {
  onLogin: (email: string, pass: string) => Promise<void>;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('admin@mangovision.com');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await onLogin(email, password);
    } catch (err: any) {
      setError(err.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7F5] flex items-center justify-center p-6 selection:bg-emerald-500 selection:text-white">
      <div className="max-w-md w-full bg-white rounded-4xl p-8 border border-slate-200/80 shadow-2xl relative overflow-hidden">
        {/* Subtle Top Glow */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Logo & Heading */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-3xl bg-gradient-to-tr from-emerald-800 to-emerald-600 flex items-center justify-center text-white text-2xl mx-auto shadow-xl shadow-emerald-700/20 mb-4">
            🌿
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">MangoVision</h1>
          <p className="text-xs text-slate-400 font-medium mt-1">Smart Mango Farm Disease Detection Platform</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-2xl font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10 rounded-2xl py-3 pl-10 pr-4 text-xs font-semibold text-slate-900 outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10 rounded-2xl py-3 pl-10 pr-4 text-xs font-semibold text-slate-900 outline-none transition"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-800 active:scale-[0.99] text-white text-xs font-bold rounded-2xl shadow-lg shadow-emerald-700/20 flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In to Orchard'}</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <p className="text-[11px] font-semibold text-slate-400">
            Demo Credentials: <span className="text-slate-700 font-bold">admin@mangovision.com</span> / <span className="text-slate-700 font-bold">password123</span>
          </p>
        </div>
      </div>
    </div>
  );
};
