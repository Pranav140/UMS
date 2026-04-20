import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
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
  { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard size={16} />, roles: ['STUDENT','FACULTY','ADMIN','DEVELOPER'], section: 'main' },

  { label: 'My Courses', href: '/dashboard/my-courses', icon: <BookOpen size={16} />, roles: ['STUDENT'], section: 'academic' },
  { label: 'Attendance', href: '/dashboard/attendance', icon: <ClipboardList size={16} />, roles: ['STUDENT'], section: 'academic' },
  { label: 'Grades', href: '/dashboard/grades', icon: <Award size={16} />, roles: ['STUDENT'], section: 'academic' },
  { label: 'Transcript', href: '/dashboard/transcript', icon: <FileText size={16} />, roles: ['STUDENT'], section: 'academic' },
  { label: 'Course Catalog', href: '/dashboard/courses', icon: <Layers size={16} />, roles: ['STUDENT'], section: 'academic' },

  { label: 'My Sections', href: '/dashboard/my-sections', icon: <BookOpen size={16} />, roles: ['FACULTY'], section: 'teaching' },
  { label: 'Attendance', href: '/dashboard/attendance', icon: <ClipboardList size={16} />, roles: ['FACULTY'], section: 'teaching' },
  { label: 'Grades', href: '/dashboard/grades', icon: <Award size={16} />, roles: ['FACULTY'], section: 'teaching' },

  { label: 'Users', href: '/dashboard/users', icon: <Users size={16} />, roles: ['ADMIN','DEVELOPER'], section: 'admin' },
  { label: 'Courses', href: '/dashboard/courses', icon: <BookOpen size={16} />, roles: ['ADMIN','DEVELOPER'], section: 'admin' },
  { label: 'Programs', href: '/dashboard/degrees', icon: <GraduationCap size={16} />, roles: ['ADMIN','DEVELOPER'], section: 'admin' },
  { label: 'Semesters', href: '/dashboard/semesters', icon: <CalendarDays size={16} />, roles: ['ADMIN','DEVELOPER'], section: 'admin' },
  { label: 'Sections', href: '/dashboard/sections', icon: <Layers size={16} />, roles: ['ADMIN','DEVELOPER'], section: 'admin' },
  { label: 'Enrollments', href: '/dashboard/enrollments', icon: <GraduationCap size={16} />, roles: ['ADMIN','DEVELOPER'], section: 'admin' },
  { label: 'Attendance', href: '/dashboard/attendance', icon: <ClipboardList size={16} />, roles: ['ADMIN','DEVELOPER'], section: 'admin' },
  { label: 'Grades', href: '/dashboard/grades', icon: <BarChart2 size={16} />, roles: ['ADMIN','DEVELOPER'], section: 'admin' },
  { label: 'System Health', href: '/dashboard/health', icon: <Activity size={16} />, roles: ['ADMIN','DEVELOPER'], section: 'system' },
  { label: 'Audit Logs', href: '/dashboard/audit', icon: <ShieldCheck size={16} />, roles: ['DEVELOPER'], section: 'system' },
];

const SECTION_LABELS: Record<string, string> = {
  main: 'Main',
  academic: 'Academic',
  teaching: 'Teaching',
  admin: 'Management',
  system: 'System',
};

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { pathname } = useLocation();
  const { user } = useAuthStore();
  const role = user?.role ?? '';

  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(role));
  const sections = [...new Set(visibleItems.map((i) => i.section!))];

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-screen z-30 flex flex-col',
        'glass-sidebar transition-all duration-300 ease-out',
        collapsed ? 'w-[64px]' : 'w-[220px]'
      )}
    >
      {/* Logo */}
      <div className={cn(
        'flex items-center gap-3 px-4 py-5 border-b border-black/[0.06] dark:border-white/[0.06] shrink-0',
        collapsed && 'px-3 justify-center'
      )}>
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#0071E3] to-[#0A84FF] flex items-center justify-center shrink-0 shadow-md shadow-[#0071E3]/30">
          <GraduationCap size={16} className="text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="text-[13px] font-bold text-gray-900 dark:text-white leading-tight truncate">UMS</p>
            <p className="text-[10px] text-gray-500 dark:text-gray-500 leading-tight truncate">IIITU</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto no-scrollbar py-3 px-2">
        {sections.map((section) => {
          const items = visibleItems.filter((i) => i.section === section);
          return (
            <div key={section} className="mb-3">
              {!collapsed && (
                <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-600">
                  {SECTION_LABELS[section]}
                </p>
              )}
              <ul className="space-y-0.5">
                {items.map((item) => {
                  const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                  return (
                    <li key={item.href + item.label}>
                      <Link
                        to={item.href}
                        title={collapsed ? item.label : undefined}
                        className={cn(
                          'flex items-center gap-2.5 rounded-xl transition-all duration-150',
                          collapsed ? 'justify-center px-0 py-2.5' : 'px-3 py-2',
                          isActive
                            ? 'bg-[#0071E3]/10 dark:bg-[#0A84FF]/10 text-[#0071E3] dark:text-[#0A84FF]'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-black/[0.05] dark:hover:bg-white/[0.05] hover:text-gray-900 dark:hover:text-gray-200'
                        )}
                      >
                        <span className={cn('shrink-0', isActive && 'text-[#0071E3] dark:text-[#0A84FF]')}>{item.icon}</span>
                        {!collapsed && (
                          <span className="text-[13px] font-medium truncate">{item.label}</span>
                        )}
                        {isActive && !collapsed && (
                          <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#0071E3] dark:bg-[#0A84FF] shrink-0" />
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="p-3 border-t border-black/[0.06] dark:border-white/[0.06] shrink-0">
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center gap-2 rounded-xl p-2 text-gray-500 dark:text-gray-500 hover:bg-black/[0.05] dark:hover:bg-white/[0.05] hover:text-gray-800 dark:hover:text-gray-300 transition-all"
        >
          <ChevronLeft
            size={16}
            className={cn('transition-transform duration-300', collapsed && 'rotate-180')}
          />
          {!collapsed && <span className="text-[12px] font-medium">Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
