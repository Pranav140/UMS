import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useTheme } from '@/providers/ThemeProvider';
import { Moon, Sun, LogOut, User, ChevronDown, Search, Bell } from 'lucide-react';
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
        'fixed top-0 right-0 z-20 h-16 flex items-center justify-between px-6 bg-transparent transition-all duration-300',
        sidebarCollapsed ? 'left-[104px]' : 'left-[236px]'
      )}
    >
      {/* Page Title placeholder */}
      <div>
        {title && (
          <h1 className="text-[16px] font-extrabold text-gray-900 dark:text-white truncate">
            {title}
          </h1>
        )}
      </div>

      {/* Right controls: Pill Search, Notification bell, User profile */}
      <div className="flex items-center gap-4 ml-auto">
        {/* Search Bar - Matching the CRM Screenshot */}
        <div className="hidden md:flex items-center gap-2 px-3.5 py-2 bg-white dark:bg-[#121214] border border-black/[0.04] dark:border-white/[0.06] rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.02)] min-w-[240px]">
          <Search size={14} className="text-gray-400" />
          <span className="text-[12px] text-gray-400 flex-1 font-medium select-none">Search...</span>
          <kbd className="text-[10px] font-bold bg-black/[0.04] dark:bg-white/[0.06] text-gray-500 px-1.5 py-0.5 rounded-md">⌘K</kbd>
        </div>

        {/* Theme toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-2 rounded-full bg-white dark:bg-[#121214] border border-black/[0.04] dark:border-white/[0.06] text-gray-500 dark:text-gray-400 hover:bg-black/[0.02] transition-all"
          title="Toggle theme"
        >
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        </button>

        {/* Notification Bell */}
        <button className="relative p-2 rounded-full bg-white dark:bg-[#121214] border border-black/[0.04] dark:border-white/[0.06] text-gray-500 dark:text-gray-400 hover:bg-black/[0.02] transition-all">
          <Bell size={15} />
          <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[#DA47F9]" />
        </button>

        {/* User profile dropdown menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className={cn(
              'flex items-center gap-2 p-1 rounded-full transition-all border border-black/[0.04] dark:border-white/[0.06]',
              'bg-white dark:bg-[#121214] hover:bg-black/[0.02] dark:hover:bg-white/[0.02]',
              menuOpen && 'bg-black/[0.04] dark:bg-white/[0.04]'
            )}
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-[10px] font-bold text-white shrink-0 shadow-inner">
              {user ? getInitials(user.name) : 'U'}
            </div>
            <span className="hidden sm:inline text-[12px] font-bold text-gray-800 dark:text-gray-200 px-1">
              {user?.name?.split(' ')[0]}
            </span>
            <ChevronDown
              size={12}
              className={cn(
                'text-gray-400 dark:text-gray-600 transition-transform duration-150 mr-1',
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
