import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useTheme } from '@/providers/ThemeProvider';
import { Moon, Sun } from 'lucide-react';
import { cn, getErrorMessage } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import { authApi } from '@/lib/api';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const { user, token, setAuth } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user && token) navigate('/dashboard', { replace: true });
  }, [user, token, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      const data = await authApi.login(email, password);
      setAuth(data.user, data.token);
      toast.success(`Welcome back, ${data.user.name.split(' ')[0]}!`);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[var(--bg-page)]">
      {/* Ambient blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-[#0071E3]/[0.08] dark:bg-[#0A84FF]/[0.05] blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full bg-purple-500/[0.06] dark:bg-purple-500/[0.04] blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-sky-400/[0.04] dark:bg-sky-400/[0.03] blur-[100px]" />
      </div>

      {/* Theme toggle */}
      <button
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        className="fixed top-5 right-5 p-2.5 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-black/[0.06] dark:hover:bg-white/[0.08] backdrop-blur-sm bg-white/60 dark:bg-white/[0.05] border border-black/[0.06] dark:border-white/[0.08] transition-all z-50"
      >
        {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
      </button>

      {/* Card */}
      <div className="relative w-full max-w-[400px] mx-4">
        <div className={cn(
          'rounded-[28px] p-8 backdrop-blur-2xl',
          'bg-white/80 dark:bg-white/[0.04]',
          'border border-black/[0.07] dark:border-white/[0.09]',
          'shadow-2xl shadow-black/[0.08] dark:shadow-black/[0.60]',
        )}>
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 rounded-[18px] bg-gradient-to-br from-[#0071E3] via-[#0A84FF] to-[#6366F1] flex items-center justify-center shadow-lg shadow-[#0071E3]/30 mb-4">
              <GraduationCap size={26} className="text-white" />
            </div>
            <h1 className="text-[22px] font-bold text-gray-900 dark:text-white leading-tight">
              UMS Portal
            </h1>
            <p className="mt-1 text-[13px] text-gray-500 dark:text-gray-500 text-center">
              Sign in with your institutional account
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-gray-700 dark:text-gray-300">
                Email address
              </label>
              <input
                type="email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@iiitu.ac.in"
                className={cn(
                  'w-full h-11 px-4 text-sm rounded-xl',
                  'bg-black/[0.04] dark:bg-white/[0.06]',
                  'border border-black/[0.08] dark:border-white/[0.10]',
                  'text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-600',
                  'outline-none transition-all duration-150',
                  'focus:bg-white dark:focus:bg-white/[0.08]',
                  'focus:border-[#0071E3]/60 dark:focus:border-[#0A84FF]/60',
                  'focus:ring-2 focus:ring-[#0071E3]/15 dark:focus:ring-[#0A84FF]/15',
                  error && 'border-red-400 dark:border-red-500'
                )}
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-gray-700 dark:text-gray-300">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={cn(
                    'w-full h-11 px-4 pr-11 text-sm rounded-xl',
                    'bg-black/[0.04] dark:bg-white/[0.06]',
                    'border border-black/[0.08] dark:border-white/[0.10]',
                    'text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-600',
                    'outline-none transition-all duration-150',
                    'focus:bg-white dark:focus:bg-white/[0.08]',
                    'focus:border-[#0071E3]/60 dark:focus:border-[#0A84FF]/60',
                    'focus:ring-2 focus:ring-[#0071E3]/15 dark:focus:ring-[#0A84FF]/15',
                    error && 'border-red-400 dark:border-red-500'
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-400 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="px-3.5 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-[13px] text-red-600 dark:text-red-400 animate-fade-in">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className={cn(
                'w-full h-11 mt-2 flex items-center justify-center gap-2',
                'bg-[#0071E3] hover:bg-[#0077ED] active:bg-[#006AD6]',
                'dark:bg-[#0A84FF] dark:hover:bg-[#409CFF]',
                'text-white text-[15px] font-semibold rounded-xl',
                'transition-all duration-150',
                'shadow-lg shadow-[#0071E3]/25 dark:shadow-[#0A84FF]/20',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071E3]/40'
              )}
            >
              {loading ? (
                <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-gray-400 dark:text-gray-600 mt-5">
          Access restricted to @iiitu.ac.in accounts.
        </p>
      </div>
    </div>
  );
}
