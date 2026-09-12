import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Sparkles, ArrowRight, Lock, Mail, User, GraduationCap, Building2, BookOpen, AlertCircle } from 'lucide-react';

interface RegisterPageProps {
  onSwitchToLogin: () => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onSwitchToLogin }) => {
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    university: 'State University',
    program: 'Computer Science & AI',
    degree: 'Bachelor of Science',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.name.trim() || !formData.email.trim() || !formData.password.trim()) {
      setError('Please fill in all mandatory account fields.');
      return;
    }

    if (!formData.email.includes('@') || !formData.email.includes('.')) {
      setError('Please provide a valid university email address.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long for academic security.');
      return;
    }

    setLoading(true);
    const result = await register(formData);
    setLoading(false);

    if (!result.success) {
      setError(result.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto py-4">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-indigo-400 p-0.5 shadow-xl shadow-indigo-500/25 mb-3">
          <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-indigo-400" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Create Student Account</h1>
        <p className="text-xs text-slate-400 mt-1">
          Begin your personalized AI-guided academic and career journey
        </p>
      </div>

      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl">
        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Jordan Lee"
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-xl pl-10 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">University Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="jordan@student.edu"
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-xl pl-10 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="Minimum 6 characters"
                className="w-full bg-slate-950/60 border border-slate-800 rounded-xl pl-10 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">University / College</label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  name="university"
                  required
                  value={formData.university}
                  onChange={handleChange}
                  placeholder="State University"
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-xl pl-10 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Degree Type</label>
              <div className="relative">
                <GraduationCap className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <select
                  name="degree"
                  value={formData.degree}
                  onChange={handleChange}
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-xl pl-10 pr-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="Bachelor of Science">Bachelor of Science (B.S.)</option>
                  <option value="Bachelor of Arts">Bachelor of Arts (B.A.)</option>
                  <option value="Master of Science">Master of Science (M.S.)</option>
                  <option value="Associate Degree">Associate Degree (A.S.)</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Academic Program / Major</label>
            <div className="relative">
              <BookOpen className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                name="program"
                required
                value={formData.program}
                onChange={handleChange}
                placeholder="e.g. Computer Science, Data Science, Software Eng"
                className="w-full bg-slate-950/60 border border-slate-800 rounded-xl pl-10 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 py-3 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>Complete Registration</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-5 text-center">
          <p className="text-xs text-slate-400">
            Already have an account?{' '}
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors cursor-pointer"
            >
              Sign In
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
