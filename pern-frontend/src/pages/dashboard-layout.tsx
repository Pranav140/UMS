import { useEffect, useState } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';
import { cn } from '@/lib/utils';

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
    <div className="min-h-screen bg-[#F4F5F7] dark:bg-[#09090b] transition-all duration-300">
      {/* Capsule Sidebar */}
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} />
      
      {/* Topbar matching the layout */}
      <Topbar sidebarCollapsed={collapsed} />

      {/* Main Content Area */}
      <main
        className={cn(
          'min-h-screen pt-20 transition-all duration-300 pr-6 pb-6',
          collapsed ? 'pl-[104px]' : 'pl-[236px]'
        )}
      >
        <div className="max-w-[1400px] mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
