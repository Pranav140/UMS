import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import { StatCard } from '@/components/dashboard/stat-card';
import { GlassCard } from '@/components/ui/glass-card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/layout/page-header';
import { enrollmentApi, academicApi, coursesApi, usersApi, semestersApi } from '@/lib/api';
import { formatDateShort, GRADE_COLORS } from '@/lib/utils';
import { BookOpen, Award, Users, Layers, CalendarDays, Activity, GraduationCap, ClipboardList, BarChart2 } from 'lucide-react';
import type { Enrollment, Section, Grade, SectionAttendanceStats } from '@/types';

export default function DashboardPage() {
  const { user, isAdmin, isStudent, isFaculty } = useAuthStore();

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={`Good ${getGreeting()}, ${user?.name?.split(' ')[0] ?? 'there'}`}
        description={`Welcome to your ${user?.role ? roleLabel(user.role) : ''} dashboard`}
      />
      {isStudent() && <StudentDashboard />}
      {isFaculty() && <FacultyDashboard />}
      {isAdmin() && <AdminDashboard />}
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

function roleLabel(role: string) {
  const m: Record<string, string> = { STUDENT: 'student', FACULTY: 'faculty', ADMIN: 'admin', DEVELOPER: 'developer' };
  return m[role] ?? '';
}

// ─── Student Dashboard ────────────────────────────────────────────────────────
function StudentDashboard() {
  const { user } = useAuthStore();
  const studentId = user?.id ?? '';

  const { data: enrollments, isLoading: loadingEnrollments } = useQuery({
    queryKey: ['my-enrollments'],
    queryFn: enrollmentApi.myEnrollments,
    enabled: !!studentId,
  });

  const { data: gpaData, isLoading: loadingGpa } = useQuery({
    queryKey: ['gpa', studentId],
    queryFn: () => academicApi.gpa(studentId),
    enabled: !!studentId,
  });

  const { data: attendanceData, isLoading: loadingAttendance } = useQuery({
    queryKey: ['attendance-student', studentId],
    queryFn: () => academicApi.attendanceByStudent(studentId),
    enabled: !!studentId,
  });

  const { data: gradesData, isLoading: loadingGrades } = useQuery({
    queryKey: ['grades-student', studentId],
    queryFn: () => academicApi.gradesByStudent(studentId),
    enabled: !!studentId,
  });

  const activeEnrollments = (enrollments ?? []).filter((e: Enrollment) => e.status === 'ENROLLED');
  const overallGpa: number = parseFloat(gpaData?.cumulativeGPA ?? '0');
  const attendanceAvg = attendanceData?.length
    ? Math.round(attendanceData.reduce((s: number, a: SectionAttendanceStats) => s + a.percentage, 0) / attendanceData.length)
    : 0;
  const finalizedGrades = (gradesData ?? []).filter((g: Grade) => g.status === 'FINALIZED');

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Enrolled Courses"
          value={loadingEnrollments ? '—' : activeEnrollments.length}
          icon={<BookOpen size={20} />}
          iconColor="bg-blue-500/10 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400"
          loading={loadingEnrollments}
          subtitle="active semester"
        />
        <StatCard
          title="CGPA"
          value={loadingGpa ? '—' : overallGpa.toFixed(2)}
          icon={<BarChart2 size={20} />}
          iconColor="bg-purple-500/10 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400"
          loading={loadingGpa}
          subtitle="10-point scale"
        />
        <StatCard
          title="Avg. Attendance"
          value={loadingAttendance ? '—' : `${attendanceAvg}%`}
          icon={<ClipboardList size={20} />}
          iconColor={attendanceAvg >= 75
            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
            : 'bg-red-500/10 text-red-600 dark:text-red-400'}
          loading={loadingAttendance}
          trend={attendanceAvg >= 75 ? 'up' : 'down'}
          trendLabel={attendanceAvg >= 75 ? 'Above limit' : 'Below 75%'}
        />
        <StatCard
          title="Grades Received"
          value={loadingGrades ? '—' : finalizedGrades.length}
          icon={<Award size={20} />}
          iconColor="bg-amber-500/10 text-amber-600 dark:text-amber-400"
          loading={loadingGrades}
          subtitle="finalized"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Current Enrollments */}
        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[15px] font-semibold text-gray-900 dark:text-white">My Courses</h3>
            <Link to="/dashboard/my-courses" className="text-[12px] text-[#0071E3] dark:text-[#0A84FF] hover:underline font-medium">
              View all →
            </Link>
          </div>
          {loadingEnrollments ? (
            <SkeletonList count={3} />
          ) : activeEnrollments.length === 0 ? (
            <EmptyState text="No courses enrolled yet" />
          ) : (
            <ul className="space-y-2">
              {activeEnrollments.slice(0, 5).map((e: Enrollment) => (
                <li key={e.id} className="flex items-center gap-3 py-2 border-b border-black/[0.04] dark:border-white/[0.05] last:border-0">
                  <div className="w-8 h-8 rounded-xl bg-[#0071E3]/10 dark:bg-[#0A84FF]/10 flex items-center justify-center shrink-0">
                    <BookOpen size={14} className="text-[#0071E3] dark:text-[#0A84FF]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-gray-900 dark:text-white truncate">
                      {e.section?.course?.title ?? '—'}
                    </p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-500">
                      {e.section?.course?.code} · {e.section?.faculty?.user?.name ?? 'No faculty'}
                    </p>
                  </div>
                  <Badge variant="success" dot>Enrolled</Badge>
                </li>
              ))}
            </ul>
          )}
        </GlassCard>

        {/* Recent Grades */}
        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[15px] font-semibold text-gray-900 dark:text-white">Recent Grades</h3>
            <Link to="/dashboard/grades" className="text-[12px] text-[#0071E3] dark:text-[#0A84FF] hover:underline font-medium">
              View all →
            </Link>
          </div>
          {loadingGrades ? (
            <SkeletonList count={3} />
          ) : finalizedGrades.length === 0 ? (
            <EmptyState text="No finalized grades yet" />
          ) : (
            <ul className="space-y-2">
              {finalizedGrades.slice(0, 5).map((g: Grade) => (
                <li key={g.id} className="flex items-center gap-3 py-2 border-b border-black/[0.04] dark:border-white/[0.05] last:border-0">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                    <Award size={14} className="text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-gray-900 dark:text-white truncate">
                      {g.section?.course?.title ?? '—'}
                    </p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-500">
                      Score: {g.score ?? '—'}
                    </p>
                  </div>
                  <span className={`text-[18px] font-bold ${GRADE_COLORS[g.letter ?? ''] ?? ''}`}>{g.letter ?? '—'}</span>
                </li>
              ))}
            </ul>
          )}
        </GlassCard>
      </div>
    </div>
  );
}

// ─── Faculty Dashboard ────────────────────────────────────────────────────────
function FacultyDashboard() {
  const { data: sections, isLoading } = useQuery({
    queryKey: ['my-sections'],
    queryFn: enrollmentApi.mySections,
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Assigned Sections"
          value={isLoading ? '—' : (sections ?? []).length}
          icon={<Layers size={20} />}
          iconColor="bg-purple-500/10 text-purple-600 dark:text-purple-400"
          loading={isLoading}
        />
        <StatCard
          title="Total Students"
          value={isLoading ? '—' : (sections ?? []).reduce((s: number, sec: Section) => s + (sec._count?.enrollments ?? 0), 0)}
          icon={<GraduationCap size={20} />}
          iconColor="bg-blue-500/10 text-blue-600 dark:text-blue-400"
          loading={isLoading}
        />
        <StatCard
          title="Active Courses"
          value={isLoading ? '—' : new Set((sections ?? []).map((s: Section) => s.courseId)).size}
          icon={<BookOpen size={20} />}
          iconColor="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          loading={isLoading}
        />
      </div>

      <GlassCard>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[15px] font-semibold text-gray-900 dark:text-white">My Sections</h3>
          <Link to="/dashboard/my-sections" className="text-[12px] text-[#0071E3] dark:text-[#0A84FF] hover:underline font-medium">View all →</Link>
        </div>
        {isLoading ? <SkeletonList count={4} /> : (sections ?? []).length === 0 ? (
          <EmptyState text="No sections assigned yet" />
        ) : (
          <ul className="space-y-2">
            {(sections ?? []).map((s: Section) => (
              <li key={s.id} className="flex items-center gap-3 py-2.5 border-b border-black/[0.04] dark:border-white/[0.05] last:border-0">
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0">
                  <BookOpen size={15} className="text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-gray-900 dark:text-white truncate">{s.course?.title ?? '—'}</p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-500">{s.course?.code} · {s._count?.enrollments ?? 0}/{s.capacity} students</p>
                </div>
                <Link to={`/dashboard/attendance?section=${s.id}`} className="text-[12px] text-[#0071E3] dark:text-[#0A84FF] font-medium hover:underline whitespace-nowrap">
                  Mark
                </Link>
              </li>
            ))}
          </ul>
        )}
      </GlassCard>
    </div>
  );
}

// ─── Admin Dashboard ──────────────────────────────────────────────────────────
function AdminDashboard() {
  const { data: users, isLoading: loadingUsers } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.list(),
  });
  const { data: courses, isLoading: loadingCourses } = useQuery({
    queryKey: ['courses'],
    queryFn: coursesApi.list,
  });
  const { data: activeSemester, isLoading: loadingSemester } = useQuery({
    queryKey: ['active-semester'],
    queryFn: () => semestersApi.active().catch(() => null),
  });
  const { data: allEnrollments, isLoading: loadingEnrollments } = useQuery({
    queryKey: ['all-enrollments'],
    queryFn: () => enrollmentApi.all(),
  });

  const totalUsers = (users ?? []).length;
  const totalCourses = (courses ?? []).length;
  const totalEnrollments = (allEnrollments ?? []).filter((e: Enrollment) => e.status === 'ENROLLED').length;

  const byRole: Record<string, number> = {};
  (users ?? []).forEach((u: { role: string }) => { byRole[u.role] = (byRole[u.role] ?? 0) + 1; });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Users" value={loadingUsers ? '—' : totalUsers} icon={<Users size={20} />} iconColor="bg-blue-500/10 text-blue-600 dark:text-blue-400" loading={loadingUsers} />
        <StatCard title="Courses" value={loadingCourses ? '—' : totalCourses} icon={<BookOpen size={20} />} iconColor="bg-purple-500/10 text-purple-600 dark:text-purple-400" loading={loadingCourses} />
        <StatCard title="Active Enrollments" value={loadingEnrollments ? '—' : totalEnrollments} icon={<GraduationCap size={20} />} iconColor="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" loading={loadingEnrollments} />
        <StatCard title="Active Semester" value={loadingSemester ? '—' : (activeSemester?.name ?? 'None')} icon={<CalendarDays size={20} />} iconColor="bg-amber-500/10 text-amber-600 dark:text-amber-400" loading={loadingSemester} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* User role breakdown */}
        <GlassCard>
          <h3 className="text-[15px] font-semibold text-gray-900 dark:text-white mb-4">Users by Role</h3>
          {loadingUsers ? <SkeletonList count={4} /> : (
            <ul className="space-y-2">
              {Object.entries(byRole).map(([role, count]) => (
                <li key={role} className="flex items-center gap-3">
                  <Badge variant={roleBadgeVariant(role)}>{role}</Badge>
                  <div className="flex-1">
                    <div className="h-2 rounded-full bg-black/[0.05] dark:bg-white/[0.06] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#0071E3] dark:bg-[#0A84FF] transition-all duration-700"
                        style={{ width: `${totalUsers ? (count / totalUsers) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-[13px] font-semibold text-gray-700 dark:text-gray-300 w-8 text-right">{count}</span>
                </li>
              ))}
            </ul>
          )}
        </GlassCard>

        {/* Quick links */}
        <GlassCard>
          <h3 className="text-[15px] font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Provision User', href: '/dashboard/users', icon: <Users size={16} /> },
              { label: 'Create Course', href: '/dashboard/courses', icon: <BookOpen size={16} /> },
              { label: 'Manage Semesters', href: '/dashboard/semesters', icon: <CalendarDays size={16} /> },
              { label: 'System Health', href: '/dashboard/health', icon: <Activity size={16} /> },
            ].map((a) => (
              <Link
                key={a.label}
                to={a.href}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-black/[0.03] dark:bg-white/[0.03] hover:bg-[#0071E3]/10 dark:hover:bg-[#0A84FF]/10 text-gray-700 dark:text-gray-300 hover:text-[#0071E3] dark:hover:text-[#0A84FF] transition-all group border border-transparent hover:border-[#0071E3]/20 dark:hover:border-[#0A84FF]/20"
              >
                <span className="text-gray-400 dark:text-gray-600 group-hover:text-[#0071E3] dark:group-hover:text-[#0A84FF] transition-colors">{a.icon}</span>
                <span className="text-[13px] font-medium">{a.label}</span>
              </Link>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

function roleBadgeVariant(role: string): 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral' {
  const m: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
    STUDENT: 'default', FACULTY: 'info', ADMIN: 'warning', DEVELOPER: 'success',
  };
  return m[role] ?? 'neutral';
}

function SkeletonList({ count }: { count: number }) {
  return (
    <ul className="space-y-2.5">
      {Array.from({ length: count }).map((_, i) => (
        <li key={i} className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gray-200 dark:bg-white/[0.06] animate-pulse shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 rounded-md bg-gray-200 dark:bg-white/[0.06] animate-pulse w-3/4" />
            <div className="h-2 rounded-md bg-gray-200 dark:bg-white/[0.04] animate-pulse w-1/2" />
          </div>
        </li>
      ))}
    </ul>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="py-8 text-center text-[13px] text-gray-400 dark:text-gray-600">{text}</div>
  );
}
