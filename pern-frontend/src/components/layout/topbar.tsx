import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useTheme } from '@/providers/ThemeProvider';
import { Moon, Sun, LogOut, User, ChevronDown } from 'lucide-react';
import { cn, getInitials, ROLE_LABELS } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import { authApi } from '@/lib/api';
import toast from 'react-hot-toast';

interface TopbarProps {
  sidebarCollapsed: boolean;
  title?: string;
}

export function Topbar({ sidebarCollapsed, title }: TopbarProps) {
  const { theme, setTheme } = useTheme();
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await authApi.logout();
    } catch {
      // proceed even if server fails
    } finally {
      clearAuth();
      navigate('/login', { replace: true });
      toast.success('Signed out successfully');
    }
  };

  return (
    <header
      className={cn(
        'fixed top-0 right-0 z-20 h-14 flex items-center justify-between px-4 sm:px-6',
        'glass-topbar transition-all duration-300',
        sidebarCollapsed ? 'left-[64px]' : 'left-[220px]'
      )}
    >
      {/* Page title */}
      <div>
        {title && (
          <h1 className="text-[15px] font-semibold text-gray-900 dark:text-white truncate">
            {title}
          </h1>
        )}
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2 ml-auto">
        {/* Theme toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-black/[0.06] dark:hover:bg-white/[0.08] transition-all"
          title="Toggle theme"
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className={cn(
              'flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-xl transition-all',
              'hover:bg-black/[0.06] dark:hover:bg-white/[0.08]',
              menuOpen && 'bg-black/[0.06] dark:bg-white/[0.08]'
            )}
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#0071E3] to-[#6366F1] flex items-center justify-center text-[11px] font-bold text-white shrink-0">
              {user ? getInitials(user.name) : 'U'}
            </div>
            <div className="hidden sm:flex flex-col items-start min-w-0 max-w-[140px]">
              <span className="text-[12px] font-semibold text-gray-900 dark:text-white truncate leading-tight">
                {user?.name ?? 'User'}
              </span>
              <span className="text-[10px] text-gray-500 dark:text-gray-500 truncate leading-tight">
                {user?.role ? ROLE_LABELS[user.role] : ''}
              </span>
            </div>
            <ChevronDown
              size={13}
              className={cn(
                'text-gray-400 dark:text-gray-600 transition-transform duration-150',
                menuOpen && 'rotate-180'
              )}
            />
          </button>

          {/* Dropdown */}
          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 top-full mt-2 w-52 z-20 animate-scale-in">
                <div className="rounded-2xl bg-white/95 dark:bg-[#1C1C1E]/95 backdrop-blur-2xl border border-black/[0.08] dark:border-white/[0.10] shadow-2xl shadow-black/10 dark:shadow-black/60 overflow-hidden">
                  <div className="px-4 py-3 border-b border-black/[0.06] dark:border-white/[0.06]">
                    <p className="text-[13px] font-semibold text-gray-900 dark:text-white truncate">{user?.name}</p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-500 truncate mt-0.5">{user?.email}</p>
                  </div>

                  <div className="p-1.5">
                    <button
                      onClick={() => { setMenuOpen(false); navigate('/dashboard/profile'); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] text-gray-700 dark:text-gray-300 hover:bg-black/[0.05] dark:hover:bg-white/[0.06] transition-all text-left"
                    >
                      <User size={14} className="text-gray-400" />
                      Profile
                    </button>
                    <button
                      onClick={handleLogout}
                      disabled={loggingOut}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-all text-left"
                    >
                      <LogOut size={14} />
                      {loggingOut ? 'Signing out…' : 'Sign out'}
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
