import { useEffect, useState } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';
import { cn } from '@/lib/utils';
import { FullPageSpinner } from '@/components/ui/spinner';

export default function DashboardLayout() {
  const { user, token } = useAuthStore();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (!user || !token) {
      navigate('/login', { replace: true });
    }
  }, [user, token, navigate]);

  if (!user || !token) return null;

  return (
    <div className="min-h-screen bg-[var(--bg-page)]">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} />
      <Topbar sidebarCollapsed={collapsed} />

      <main
        className={cn(
          'min-h-screen pt-14 transition-all duration-300',
          collapsed ? 'pl-[64px]' : 'pl-[220px]'
        )}
      >
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
