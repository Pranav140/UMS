import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Eye, EyeOff, ArrowRight, Mail, Lock, Sparkles, Award, Activity } from 'lucide-react';
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

  const handleSubmit = async (e: React.FormEvent, customEmail?: string, customPassword?: string) => {
    if (e) e.preventDefault();
    setError('');

    const targetEmail = customEmail || email;
    const targetPassword = customPassword || password;

    if (!targetEmail || !targetPassword) {
      setError('Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      const data = await authApi.login(targetEmail, targetPassword);
      setAuth(data.user, data.token);
      toast.success(`Welcome back, ${data.user.name.split(' ')[0]}!`);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleShortcutLogin = (role: 'student' | 'faculty' | 'admin' | 'developer') => {
    let u = '';
    let p = '';
    switch (role) {
      case 'student':
        u = '24429@iiitu.ac.in';
        p = 'Student@2026';
        break;
      case 'faculty':
        u = 'manish.g@iiitu.ac.in';
        p = 'Faculty@2026';
        break;
      case 'admin':
        u = 'sukhsagar@iiitu.ac.in';
        p = 'Admin@2026';
        break;
      case 'developer':
        u = 'developer@iiitu.ac.in';
        p = 'Dev@2026';
        break;
    }
    setEmail(u);
    setPassword(p);
    handleSubmit(null as any, u, p);
  };

  return (
    <div className="min-h-screen flex bg-[#F5F5F7] dark:bg-[#000000] overflow-hidden">
      {/* LEFT PANEL: Matches Sidebar theme bg-[#0b0b0b] */}
      <div className="hidden md:flex w-1/2 relative bg-[#0b0b0b] flex-col justify-between p-12 overflow-hidden border-r border-white/[0.05]">
        {/* Glow ambient background circles */}
        <div className="absolute top-[-100px] left-[-100px] w-[400px] h-[400px] rounded-full bg-white/[0.02] blur-[100px]" />
        <div className="absolute bottom-[-100px] right-[-100px] w-[450px] h-[450px] rounded-full bg-white/[0.03] blur-[120px]" />
        
        {/* Decorative Grid Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none opacity-40" />

        {/* Brand header matching sidebar logo style */}
        <div className="relative flex items-center gap-3 z-10">
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-black shadow-lg">
            <GraduationCap size={20} className="stroke-[2.5]" />
          </div>
          <span className="text-[16px] font-black text-white tracking-widest leading-none">UMS PORTAL</span>
        </div>

        {/* Visual Graphics - Sidebar styled mock UI card */}
        <div className="relative flex flex-col items-center justify-center flex-1 my-8 z-10">
          {/* Main mock card */}
          <div className="w-full max-w-[340px] p-5 rounded-[24px] bg-white/[0.04] border border-white/[0.08] backdrop-blur-md shadow-2xl relative animate-pulse-soft">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white">
                  <Award size={15} />
                </div>
                <div>
                  <h4 className="text-[12px] font-bold text-white leading-tight">Average CGPA</h4>
                  <p className="text-[10px] text-gray-400">Semester overall</p>
                </div>
              </div>
              <span className="text-[14px] font-black text-black bg-white px-2 py-0.5 rounded-lg border border-white/20">9.24</span>
            </div>

            {/* Spark line graphic */}
            <div className="h-12 w-full flex items-end gap-1 mb-2">
              <div className="w-full h-[30%] bg-white/5 rounded-t-sm" />
              <div className="w-full h-[45%] bg-white/10 rounded-t-sm" />
              <div className="w-full h-[60%] bg-white/15 rounded-t-sm" />
              <div className="w-full h-[50%] bg-white/20 rounded-t-sm" />
              <div className="w-full h-[75%] bg-white/40 rounded-t-sm" />
              <div className="w-full h-[90%] bg-white rounded-t-sm animate-pulse" />
            </div>

            {/* Overlay secondary badge */}
            <div className="absolute -bottom-6 -right-6 p-3 rounded-[18px] bg-[#0b0b0b] border border-white/[0.08] shadow-xl flex items-center gap-2 max-w-[150px]">
              <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-white">
                <Activity size={12} />
              </div>
              <div>
                <h5 className="text-[9px] font-bold text-gray-400">Attendance</h5>
                <p className="text-[10px] font-black text-white">94.8% Pres.</p>
              </div>
            </div>
          </div>

          <div className="mt-12 text-center max-w-[360px]">
            <h2 className="text-[20px] font-extrabold text-white leading-snug">
              Elevate Academic Management
            </h2>
            <p className="mt-2 text-[12px] text-gray-400 leading-relaxed">
              Experience the next-generation portal packed with real-time academic stats, dynamic course rosters, and AI-powered insights.
            </p>
          </div>
        </div>

        {/* Brand footer quote */}
        <div className="relative text-[11px] text-gray-500 italic z-10">
          "Education is the passport to the future." — IIIT Una
        </div>
      </div>

      {/* RIGHT PANEL: Login Form Panel */}
      <div className="w-full md:w-1/2 flex flex-col justify-between p-6 md:p-12 relative items-center justify-center">
        {/* Glow ambient background circles for Right Panel */}
        <div className="absolute top-[20%] right-[10%] w-[300px] h-[300px] rounded-full bg-black/[0.02] dark:bg-white/[0.01] blur-[100px] pointer-events-none" />

        {/* Theme toggle */}
        <div className="w-full flex justify-end z-20">
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2.5 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-black/[0.06] dark:hover:bg-white/[0.08] backdrop-blur-sm bg-white/60 dark:bg-white/[0.05] border border-black/[0.06] dark:border-white/[0.08] transition-all"
          >
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </div>

        {/* Form Card wrapper */}
        <div className="w-full max-w-[400px] my-auto z-10">
          <div className="flex flex-col mb-7 text-center md:text-left md:items-start items-center">
            {/* Logo for mobile view */}
            <div className="md:hidden w-12 h-12 rounded-full bg-[#0b0b0b] dark:bg-white flex items-center justify-center text-white dark:text-black shadow-lg mb-4">
              <GraduationCap size={22} className="stroke-[2.5]" />
            </div>
            <h1 className="text-[26px] font-black text-gray-900 dark:text-white tracking-tight">
              Sign In
            </h1>
            <p className="mt-1.5 text-[13px] text-gray-500 dark:text-gray-400 font-medium">
              Enter credentials below to access your institutional dashboard.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email input field */}
            <div className="space-y-1.5">
              <label className="text-[12px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Email address
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-600 pointer-events-none">
                  <Mail size={15} />
                </div>
                <input
                  type="email"
                  autoComplete="email"
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@iiitu.ac.in"
                  className={cn(
                    'w-full h-12 pl-11 pr-4 text-sm rounded-2xl',
                    'bg-[#EBEBEF] dark:bg-[#1C1C1E]',
                    'border border-black/[0.04] dark:border-white/[0.05]',
                    'text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-600',
                    'outline-none transition-all duration-155',
                    'focus:bg-white dark:focus:bg-[#252528]',
                    'focus:border-[#0b0b0b]/60 dark:focus:border-white/60',
                    'focus:ring-4 focus:ring-black/5 dark:focus:ring-white/5',
                    error && 'border-red-400 dark:border-red-500'
                  )}
                />
              </div>
            </div>

            {/* Password input field */}
            <div className="space-y-1.5">
              <label className="text-[12px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Password
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-600 pointer-events-none">
                  <Lock size={15} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={cn(
                    'w-full h-12 pl-11 pr-11 text-sm rounded-2xl',
                    'bg-[#EBEBEF] dark:bg-[#1C1C1E]',
                    'border border-black/[0.04] dark:border-white/[0.05]',
                    'text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-600',
                    'outline-none transition-all duration-155',
                    'focus:bg-white dark:focus:bg-[#252528]',
                    'focus:border-[#0b0b0b]/60 dark:focus:border-white/60',
                    'focus:ring-4 focus:ring-black/5 dark:focus:ring-white/5',
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

            {/* Error messaging bar */}
            {error && (
              <div className="px-3.5 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-[13px] text-red-600 dark:text-red-400 animate-fade-in">
                {error}
              </div>
            )}

            {/* Action button - Matches Sidebar style: dark bg in light mode, white bg in dark mode */}
            <button
              type="submit"
              disabled={loading}
              className={cn(
                'w-full h-12 mt-2 flex items-center justify-center gap-2 rounded-2xl font-bold text-[15px]',
                'bg-[#0b0b0b] text-white hover:bg-black/90 active:bg-black',
                'dark:bg-white dark:text-black dark:hover:bg-white/90 dark:active:bg-white',
                'transition-all duration-150',
                'shadow-lg shadow-black/10 dark:shadow-white/5',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'focus:outline-none focus:ring-4 focus:ring-black/20 dark:focus:ring-white/20'
              )}
            >
              {loading ? (
                <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white dark:border-black/30 dark:border-t-black animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Quick Debugging / Testing accounts shortcut pills */}
          <div className="mt-8 pt-6 border-t border-black/[0.05] dark:border-white/[0.05]">
            <div className="flex items-center gap-1.5 justify-center md:justify-start mb-2.5">
              <Sparkles size={13} className="text-gray-400 dark:text-gray-500" />
              <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                Instant Mock Login
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 justify-center md:justify-start">
              {(['student', 'faculty', 'admin', 'developer'] as const).map((role) => (
                <button
                  key={role}
                  onClick={() => handleShortcutLogin(role)}
                  className="text-[11px] font-bold px-3 py-1 rounded-full bg-black/[0.03] dark:bg-white/[0.04] text-gray-500 dark:text-gray-400 hover:bg-[#0b0b0b] hover:text-white dark:hover:bg-white dark:hover:text-black border border-black/[0.02] dark:border-white/[0.02] transition-all capitalize"
                >
                  {role}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer info text */}
        <div className="w-full text-center text-[11px] text-gray-400 dark:text-gray-600 mt-6">
          Access restricted to @iiitu.ac.in domains. UMS © 2026.
        </div>
      </div>
    </div>
  );
}
