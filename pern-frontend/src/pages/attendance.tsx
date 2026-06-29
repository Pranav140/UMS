import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { academicApi, enrollmentApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { PageHeader } from '@/components/layout/page-header';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { DataTable } from '@/components/ui/table';
import { getErrorMessage, cn } from '@/lib/utils';
import { ClipboardList, Check, X, Plus, ChevronDown, ChevronRight, BarChart2, Activity } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Enrollment, Section, SectionAttendanceStats } from '@/types';

export default function AttendancePage() {
  const { isStudent, isFaculty, isAdmin, user } = useAuthStore();
  if (isStudent()) return <StudentAttendance studentId={user!.id} />;
  if (isFaculty() || isAdmin()) return <FacultyAttendance />;
  return null;
}

// ─── Student view ──────────────────────────────────────────────────────────────
function StudentAttendance({ studentId }: { studentId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['attendance-student', studentId],
    queryFn: () => academicApi.attendanceByStudent(studentId),
  });

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Attendance" description="Your attendance records and academic compliance" />
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 rounded-2xl bg-white/80 dark:bg-white/[0.04] animate-pulse" />
          ))}
        </div>
      ) : !data || data.length === 0 ? (
        <GlassCard className="text-center py-12 text-sm text-gray-400 dark:text-gray-600">
          No attendance records found.
        </GlassCard>
      ) : (
        <div className="space-y-4">
          {(data as SectionAttendanceStats[]).map((stat) => (
            <GlassCard key={stat.section?.id ?? ''}>
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0",
                  stat.percentage >= 75 ? 'bg-emerald-500/10' : 'bg-red-500/10'
                )}>
                  <ClipboardList size={20} className={stat.percentage >= 75 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-bold text-gray-900 dark:text-white">{stat.section?.course?.title ?? '—'}</p>
                  <p className="text-[12px] text-gray-500 mt-0.5">{stat.present} present · {stat.absent} absent · {stat.total} classes total</p>
                </div>
                <div className="text-right shrink-0">
                  <p className={cn(
                    "text-[22px] font-black tracking-tight",
                    stat.percentage >= 75 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                  )}>
                    {stat.percentage}%
                  </p>
                  <Badge variant={stat.percentage >= 75 ? 'success' : 'danger'}>
                    {stat.percentage >= 75 ? 'Meets Criteria' : 'Shortage'}
                  </Badge>
                </div>
              </div>
              {/* Progress bar */}
              <div className="mt-4 h-2 rounded-full bg-black/[0.04] dark:bg-white/[0.06] overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-750",
                    stat.percentage >= 75
                      ? "bg-gradient-to-r from-emerald-400 to-teal-500"
                      : "bg-gradient-to-r from-red-400 to-rose-500"
                  )}
                  style={{ width: `${stat.percentage}%` }}
                />
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Attendance Section Analytics Component ──────────────────────────────────
interface AttendanceSectionAnalyticsProps {
  records: any[];
  grouped: Record<string, any[]>;
  dates: string[];
}

function AttendanceSectionAnalytics({ records, grouped, dates }: AttendanceSectionAnalyticsProps) {
  if (records.length === 0) return null;

  const totalPresents = records.filter((r) => r.isPresent).length;
  const avgPct = Math.round((totalPresents / records.length) * 100);

  // Group by student to find who is below 75%
  const studentStats: Record<string, { name: string; present: number; total: number }> = {};
  records.forEach((r) => {
    const sId = r.studentId;
    const name = r.student?.name || 'Student';
    if (!studentStats[sId]) {
      studentStats[sId] = { name, present: 0, total: 0 };
    }
    if (r.isPresent) studentStats[sId].present++;
    studentStats[sId].total++;
  });

  const lowAttendanceCount = Object.values(studentStats).filter(
    (s) => (s.present / s.total) * 100 < 75
  ).length;

  // Let's get the last 8 dates for the bar chart
  const recentDates = [...dates].reverse().slice(-8);
  const chartData = recentDates.map((date) => {
    const dayRecords = grouped[date] || [];
    const presents = dayRecords.filter((r) => r.isPresent).length;
    const pct = dayRecords.length > 0 ? Math.round((presents / dayRecords.length) * 100) : 0;
    return {
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      pct,
    };
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-1">
      {/* Stats */}
      <div className="lg:col-span-1 grid grid-cols-2 gap-3 shrink-0">
        <div className="p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/[0.05]">
          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Avg Attendance</p>
          <p className={cn("text-[20px] font-bold mt-1 leading-none", avgPct >= 75 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400")}>
            {avgPct}%
          </p>
          <span className="text-[9px] text-gray-400 mt-1 block">{avgPct >= 75 ? "Target met" : "Shortage zone"}</span>
        </div>
        <div className="p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/[0.05]">
          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Defaulters</p>
          <p className="text-[20px] font-bold text-rose-500 mt-1 leading-none">{lowAttendanceCount}</p>
          <span className="text-[9px] text-gray-400 mt-1 block">students &lt; 75%</span>
        </div>
        <div className="p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/[0.05]">
          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Total Classes</p>
          <p className="text-[20px] font-bold text-gray-900 dark:text-white mt-1 leading-none">{dates.length}</p>
          <span className="text-[9px] text-gray-400 mt-1 block">sessions conducted</span>
        </div>
        <div className="p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/[0.05]">
          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Class Size</p>
          <p className="text-[20px] font-bold text-indigo-600 dark:text-indigo-400 mt-1 leading-none">
            {Object.keys(studentStats).length}
          </p>
          <span className="text-[9px] text-gray-400 mt-1 block">enrolled roster</span>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="lg:col-span-2 p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/[0.05] flex flex-col justify-between">
        <div>
          <h4 className="text-[13px] font-bold text-gray-800 dark:text-gray-200 mb-1">Attendance Trend</h4>
          <p className="text-[10px] text-gray-500 mb-3">Presence percentage over recent sessions</p>

          <div className="flex items-end justify-between h-20 pt-1.5 px-1 gap-2.5">
            {chartData.length === 0 ? (
              <div className="w-full flex items-center justify-center text-gray-400 text-[11px] h-full">
                Not enough history to render trends
              </div>
            ) : (
              chartData.map((d, idx) => (
                <div key={idx} className="flex flex-col items-center flex-1 group">
                  <div className="relative w-full flex justify-center items-end h-14 bg-black/[0.02] dark:bg-white/[0.01] rounded-t-md">
                    <div
                      className={cn(
                        "w-full rounded-t-md transition-all duration-700",
                        d.pct >= 75
                          ? "bg-gradient-to-t from-emerald-400 to-teal-500"
                          : "bg-gradient-to-t from-red-400 to-rose-500"
                      )}
                      style={{ height: `${d.pct}%` }}
                    />
                    <span className="absolute -top-5 text-[9px] font-bold bg-gray-900 text-white dark:bg-white dark:text-black px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-sm pointer-events-none">
                      {d.pct}%
                    </span>
                  </div>
                  <span className="text-[8px] text-gray-400 font-semibold mt-1 truncate max-w-full text-center">
                    {d.date}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Faculty / Admin view ──────────────────────────────────────────────────────
function FacultyAttendance() {
  const [params] = useSearchParams();
  const defaultSection = params.get('section') ?? '';
  const { isFaculty } = useAuthStore();
  const qc = useQueryClient();

  const { data: sections = [] } = useQuery({
    queryKey: isFaculty() ? ['my-sections'] : ['all-enrollments-admin'],
    queryFn: () => (isFaculty() ? enrollmentApi.mySections() : enrollmentApi.all()) as Promise<unknown[]>,
  });

  const sectionList: Section[] = isFaculty()
    ? (sections as Section[])
    : [...new Map((sections as { section: Section }[]).map((e) => [e.section?.id, e.section])).values()].filter(Boolean) as Section[];

  const [selectedSection, setSelectedSection] = useState(defaultSection || (sectionList[0]?.id ?? ''));
  const [showMark, setShowMark] = useState(false);

  useEffect(() => {
    if (!selectedSection && sectionList.length > 0) {
      setSelectedSection(sectionList[0].id);
    }
  }, [sectionList, selectedSection]);

  const { data: attendanceData = [], isLoading } = useQuery({
    queryKey: ['attendance-section', selectedSection],
    queryFn: () => academicApi.attendanceBySection(selectedSection),
    enabled: !!selectedSection,
  });

  const groupedAttendance = (attendanceData ?? []).reduce((acc: Record<string, any[]>, curr: any) => {
    const date = new Date(curr.date).toISOString().split('T')[0];
    if (!acc[date]) acc[date] = [];
    acc[date].push(curr);
    return acc;
  }, {});

  const sortedDates = Object.keys(groupedAttendance).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  const sectionInfo = sectionList.find((s) => s.id === selectedSection);

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Attendance"
        description="Record and analyze student attendance metrics"
        action={
          selectedSection && (
            <Button icon={<Plus size={16} />} onClick={() => setShowMark(true)}>
              Mark Attendance
            </Button>
          )
        }
      />

      <GlassCard padding="sm">
        <Select value={selectedSection} onChange={(e) => setSelectedSection(e.target.value)}>
          <option value="">Select a section</option>
          {sectionList.map((s) => (
            <option key={s.id} value={s.id}>
              {s.course?.title} ({s.course?.code}) - Sec {s.sectionCode}
            </option>
          ))}
        </Select>
      </GlassCard>

      {selectedSection && (
        <>
          {/* Section Attendance Analytics & Chart */}
          <GlassCard>
            <div className="flex items-center gap-2 mb-4">
              <Activity size={18} className="text-[#0071E3] dark:text-[#0A84FF]" />
              <h3 className="text-[15px] font-bold text-gray-900 dark:text-white">Section Attendance Trend</h3>
            </div>
            {isLoading ? (
              <div className="h-40 bg-gray-100 dark:bg-white/[0.04] animate-pulse rounded-2xl" />
            ) : (
              <AttendanceSectionAnalytics
                records={attendanceData}
                grouped={groupedAttendance}
                dates={sortedDates}
              />
            )}
          </GlassCard>

          {/* Attendance History */}
          <div className="space-y-4">
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-14 rounded-2xl bg-white/80 dark:bg-white/[0.04] animate-pulse" />
                ))}
              </div>
            ) : sortedDates.length === 0 ? (
              <GlassCard className="text-center py-12 text-sm text-gray-400 dark:text-gray-600">
                No attendance logs found for this section. Click 'Mark Attendance' to register a lecture.
              </GlassCard>
            ) : (
              sortedDates.map((date) => (
                <AttendanceDayGroup key={date} date={date} records={groupedAttendance[date]} />
              ))
            )}
          </div>
        </>
      )}

      {selectedSection && (
        <MarkAttendanceModal open={showMark} onClose={() => setShowMark(false)} sectionId={selectedSection} />
      )}
    </div>
  );
}

// ─── Attendance Day Group ──────────────────────────────────────────────────────
function AttendanceDayGroup({ date, records }: { date: string; records: any[] }) {
  const [open, setOpen] = useState(false);
  const presentCount = records.filter((r) => r.isPresent).length;

  return (
    <GlassCard padding="none" className="overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-3">
          {open ? <ChevronDown size={18} className="text-gray-400" /> : <ChevronRight size={18} className="text-gray-400" />}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white text-left">
              {new Date(date).toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </h3>
            <p className="text-[12px] text-gray-500 text-left mt-0.5">
              {records.length} total students
            </p>
          </div>
        </div>
        <Badge variant={presentCount / records.length >= 0.75 ? 'success' : 'warning'}>
          {presentCount} Present · {records.length - presentCount} Absent
        </Badge>
      </button>

      {open && (
        <div className="border-t border-black/[0.05] dark:border-white/[0.05] p-2 bg-black/[0.01] dark:bg-white/[0.01]">
          <DataTable
            columns={[
              {
                key: 'student',
                header: 'Student Name',
                render: (r) => <span className="text-[13px] font-semibold">{(r as any).student?.name ?? '—'}</span>,
              },
              {
                key: 'email',
                header: 'Email ID',
                render: (r) => <span className="text-[12px] text-gray-500">{(r as any).student?.email ?? '—'}</span>,
              },
              {
                key: 'status',
                header: 'Status',
                render: (r) =>
                  (r as any).isPresent ? (
                    <Badge variant="success" dot>
                      Present
                    </Badge>
                  ) : (
                    <Badge variant="danger" dot>
                      Absent
                    </Badge>
                  ),
                width: '120px',
              },
            ]}
            data={records}
          />
        </div>
      )}
    </GlassCard>
  );
}

// ─── Mark Attendance Modal ─────────────────────────────────────────────────────
function MarkAttendanceModal({ open, onClose, sectionId }: { open: boolean; onClose: () => void; sectionId: string }) {
  const qc = useQueryClient();
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [attendance, setAttendance] = useState<Record<string, boolean>>({});

  const { data: enrollmentList = [] } = useQuery({
    queryKey: ['enrollment-section', sectionId],
    queryFn: () => enrollmentApi.bySection(sectionId),
    enabled: open && !!sectionId,
  });

  const bulkMutation = useMutation({
    mutationFn: (payload: { sectionId: string; date: string; attendances: Array<{ studentId: string; isPresent: boolean }> }) =>
      academicApi.bulkAttendance(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['attendance-section', sectionId] });
      toast.success('Attendance recorded');
      onClose();
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const toggle = (id: string) => setAttendance((p) => ({ ...p, [id]: !(p[id] ?? true) }));

  const submit = () => {
    const attendances = (enrollmentList as Enrollment[]).map((e) => ({
      studentId: e.studentId,
      isPresent: attendance[e.studentId] ?? true,
    }));
    bulkMutation.mutate({ sectionId, date, attendances });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Mark Attendance"
      size="md"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" loading={bulkMutation.isPending} onClick={submit}>
            Save Attendance
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        {enrollmentList.length === 0 ? (
          <p className="text-center py-4 text-sm text-gray-400 dark:text-gray-600">No enrolled students found.</p>
        ) : (
          <ul className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
            {(enrollmentList as Enrollment[]).map((e) => {
              const isPresent = attendance[e.studentId] ?? true;
              return (
                <li key={e.id} className="flex items-center justify-between p-2.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/[0.05] hover:bg-black/[0.03]">
                  <p className="flex-1 min-w-0 truncate text-[13px] text-gray-900 dark:text-white pr-4">
                    {e.student?.name ?? e.studentId.slice(0, 8)}
                  </p>
                  <button
                    onClick={() => toggle(e.studentId)}
                    className={cn(
                      "flex items-center justify-center shrink-0 gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-bold transition-all",
                      isPresent
                        ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20'
                        : 'bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20'
                    )}
                  >
                    {isPresent ? (
                      <>
                        <Check size={12} /> Present
                      </>
                    ) : (
                      <>
                        <X size={12} /> Absent
                      </>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Modal>
  );
}
