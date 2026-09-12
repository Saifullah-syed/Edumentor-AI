import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Sparkles, ArrowRight, Lock, Mail, AlertCircle, UserCheck } from 'lucide-react';

interface LoginPageProps {
  onSwitchToRegister: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSwitchToRegister }) => {
  const { login, loginAsDemoStudent } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError('Please provide both your email address and password.');
      return;
    }

    setLoading(true);
    const result = await login(email, password);
    setLoading(false);

    if (!result.success) {
      setError(result.message || 'Login failed. Please check your credentials.');
    }
  };

  const handleDemoStudent = async () => {
    setError(null);
    setEmail('saifullah@student.edu');
    setPassword('Student123!');
    setLoading(true);
    const result = await loginAsDemoStudent();
    setLoading(false);
    if (!result.success) setError(result.message || 'Demo login failed.');
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Brand Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-indigo-400 p-0.5 shadow-xl shadow-indigo-500/25 mb-4 animate-glow">
          <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
            <Sparkles className="w-7 h-7 text-indigo-400" />
          </div>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Welcome to EduMentor AI
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-2">
          Personalized Academic Advising &amp; Career Roadmap Intelligence
        </p>
      </div>

      {/* Main Login Card */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl relative overflow-hidden">
        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              University Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@saifullah.ai or saifullah@student.edu"
                className="w-full bg-slate-950/60 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Account Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950/60 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>Sign In to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Demo Student Quick-Fill Section */}
        <div className="mt-6 pt-5 border-t border-slate-800/80">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2.5 text-center">
            One-Click Demo Student Access
          </p>
          <button
            type="button"
            onClick={handleDemoStudent}
            disabled={loading}
            className="w-full px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 hover:border-indigo-500/40 rounded-xl text-left flex items-center justify-between transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                <UserCheck className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white group-hover:text-indigo-300 transition-colors">
                  Demo User (Student)
                </p>
                <p className="text-[11px] text-slate-400">Saifullah • saifullah@student.edu</p>
              </div>
            </div>
            <span className="text-[11px] font-medium text-indigo-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
              Quick Fill &amp; Sign In →
            </span>
          </button>
        </div>

        {/* Switch to Register */}
        <div className="mt-6 text-center">
          <p className="text-xs text-slate-400">
            Don't have an account yet?{' '}
            <button
              type="button"
              onClick={onSwitchToRegister}
              className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors cursor-pointer"
            >
              Create Student Account
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
