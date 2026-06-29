import { Link, useLocation } from 'react-router-dom';
import { cn, getInitials } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import {
  LayoutDashboard,
  GraduationCap,
  Users,
  BookOpen,
  CalendarDays,
  Layers,
  ClipboardList,
  BarChart2,
  FileText,
  Activity,
  ChevronLeft,
  ShieldCheck,
  Award,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  roles: string[];
  section?: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard size={18} />, roles: ['STUDENT','FACULTY','ADMIN','DEVELOPER'], section: 'main' },
  { label: 'My Courses', href: '/dashboard/my-courses', icon: <BookOpen size={18} />, roles: ['STUDENT'], section: 'academic' },
  { label: 'Attendance', href: '/dashboard/attendance', icon: <ClipboardList size={18} />, roles: ['STUDENT','FACULTY','ADMIN','DEVELOPER'], section: 'academic' },
  { label: 'Grades', href: '/dashboard/grades', icon: <Award size={18} />, roles: ['STUDENT','FACULTY','ADMIN','DEVELOPER'], section: 'academic' },
  { label: 'Transcript', href: '/dashboard/transcript', icon: <FileText size={18} />, roles: ['STUDENT'], section: 'academic' },
  { label: 'Course Catalog', href: '/dashboard/courses', icon: <Layers size={18} />, roles: ['STUDENT','ADMIN','DEVELOPER'], section: 'academic' },
  { label: 'My Sections', href: '/dashboard/my-sections', icon: <BookOpen size={18} />, roles: ['FACULTY'], section: 'teaching' },
  { label: 'Users', href: '/dashboard/users', icon: <Users size={18} />, roles: ['ADMIN','DEVELOPER'], section: 'admin' },
  { label: 'Programs', href: '/dashboard/degrees', icon: <GraduationCap size={18} />, roles: ['ADMIN','DEVELOPER'], section: 'admin' },
  { label: 'Semesters', href: '/dashboard/semesters', icon: <CalendarDays size={18} />, roles: ['ADMIN','DEVELOPER'], section: 'admin' },
  { label: 'Sections', href: '/dashboard/sections', icon: <Layers size={18} />, roles: ['ADMIN','DEVELOPER'], section: 'admin' },
  { label: 'Enrollments', href: '/dashboard/enrollments', icon: <GraduationCap size={18} />, roles: ['ADMIN','DEVELOPER'], section: 'admin' },
  { label: 'System Health', href: '/dashboard/health', icon: <Activity size={18} />, roles: ['ADMIN','DEVELOPER'], section: 'system' },
  { label: 'Audit Logs', href: '/dashboard/audit', icon: <ShieldCheck size={18} />, roles: ['DEVELOPER'], section: 'system' },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { pathname } = useLocation();
  const { user } = useAuthStore();
  const role = user?.role ?? '';

  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(role)).slice(0, 7); // Show primary items to match clean look

  return (
    <aside
      className={cn(
        'fixed left-4 top-4 bottom-4 z-30 flex flex-col items-center py-6',
        'bg-[#0b0b0b] text-white shadow-2xl transition-all duration-300 ease-out select-none',
        'rounded-[32px] border border-white/[0.05]',
        collapsed ? 'w-[72px]' : 'w-[200px]'
      )}
    >
      {/* Brand Logo - Styled matching the circular emblem */}
      <div className="flex flex-col items-center justify-center shrink-0 mb-6">
        <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-black shadow-lg">
          <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14.5h-2v-2h2v2zm0-4h-2v-4h2v4z" />
          </svg>
        </div>
        {!collapsed && (
          <span className="text-[12px] font-black tracking-widest text-white mt-2 leading-none">UMS IIITU</span>
        )}
      </div>

      {/* Nav Link Capsule container */}
      <nav className="flex-1 w-full px-2.5 overflow-y-auto no-scrollbar flex flex-col items-center gap-4">
        <ul className="space-y-3 w-full flex flex-col items-center">
          {visibleItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <li key={item.href + item.label} className="w-full flex justify-center">
                <Link
                  to={item.href}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    'flex items-center gap-3 transition-all duration-200 w-full',
                    collapsed ? 'justify-center w-12 h-12 rounded-[18px]' : 'px-4 py-3 rounded-2xl',
                    isActive
                      ? 'bg-white text-black scale-[1.02] shadow-md'
                      : 'text-gray-400 hover:bg-white/[0.06] hover:text-white'
                  )}
                >
                  <span className={cn('shrink-0', isActive ? 'text-black font-extrabold' : 'text-gray-400')}>{item.icon}</span>
                  {!collapsed && (
                    <span className="text-[13px] font-bold tracking-tight">{item.label}</span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom Profile / Controls */}
      <div className="w-full flex flex-col items-center gap-4 mt-auto px-3 shrink-0">
        {/* Collapse toggle */}
        <button
          onClick={onToggle}
          className="w-10 h-10 rounded-full flex items-center justify-center bg-white/[0.05] hover:bg-white/[0.1] text-gray-400 hover:text-white transition-all"
        >
          <ChevronLeft
            size={16}
            className={cn('transition-transform duration-300', collapsed && 'rotate-180')}
          />
        </button>

        {/* User avatar circle */}
        <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-white/20 bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-[13px] font-bold text-white shadow-inner">
          {user ? getInitials(user.name) : 'U'}
        </div>
      </div>
    </aside>
  );
}
