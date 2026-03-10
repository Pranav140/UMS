import { useState } from 'react';
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
import { getErrorMessage, formatDateShort } from '@/lib/utils';
import { ClipboardList, Check, X, Plus } from 'lucide-react';
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
      <PageHeader title="Attendance" description="Your attendance records" />
      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-20 rounded-2xl bg-white/80 dark:bg-white/[0.04] animate-pulse" />)}</div>
      ) : !data || data.length === 0 ? (
        <GlassCard className="text-center py-12 text-sm text-gray-400 dark:text-gray-600">No attendance records found.</GlassCard>
      ) : (
        <div className="space-y-4">
          {(data as SectionAttendanceStats[]).map((stat) => (
            <GlassCard key={stat.section?.id ?? ''}>
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${stat.percentage >= 75 ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                  <ClipboardList size={20} className={stat.percentage >= 75 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-gray-900 dark:text-white">{stat.section?.course?.title ?? '—'}</p>
                  <p className="text-[12px] text-gray-500 dark:text-gray-500">{stat.present} present · {stat.absent} absent · {stat.total} classes</p>
                </div>
                <div className="text-right">
                  <p className={`text-[22px] font-bold ${stat.percentage >= 75 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>{stat.percentage}%</p>
                  <Badge variant={stat.percentage >= 75 ? 'success' : 'danger'}>{stat.percentage >= 75 ? 'Good' : 'Low'}</Badge>
                </div>
              </div>
              {/* Progress bar */}
              <div className="mt-3 h-1.5 rounded-full bg-black/[0.05] dark:bg-white/[0.06]">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${stat.percentage >= 75 ? 'bg-emerald-500' : 'bg-red-500'}`}
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

// ─── Faculty / Admin view ──────────────────────────────────────────────────────
function FacultyAttendance() {
  const [params] = useSearchParams();
  const defaultSection = params.get('section') ?? '';
  const { isFaculty } = useAuthStore();
  const qc = useQueryClient();

  const { data: sections = [] } = useQuery({
    queryKey: isFaculty() ? ['my-sections'] : ['all-enrollments'],
    queryFn: () => (isFaculty() ? enrollmentApi.mySections() : enrollmentApi.all()) as Promise<unknown[]>,
  });

  const sectionList: Section[] = isFaculty()
    ? (sections as Section[])
    : [...new Map((sections as { section: Section }[]).map((e) => [e.section?.id, e.section])).values()].filter(Boolean) as Section[];

  const [selectedSection, setSelectedSection] = useState(defaultSection || (sectionList[0]?.id ?? ''));
  const [showMark, setShowMark] = useState(false);

  const { data: attendanceData, isLoading } = useQuery({
    queryKey: ['attendance-section', selectedSection],
    queryFn: () => academicApi.attendanceBySection(selectedSection),
    enabled: !!selectedSection,
  });

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Attendance" description="Record and review student attendance"
        action={<Button icon={<Plus size={16} />} onClick={() => setShowMark(true)}>Mark Attendance</Button>}
      />

      {/* Section selector */}
      <GlassCard padding="sm">
        <div className="flex flex-wrap gap-3">
          <Select value={selectedSection} onChange={(e) => setSelectedSection(e.target.value)}>
            <option value="">Select section</option>
            {sectionList.map((s) => (
              <option key={s.id} value={s.id}>{s.course?.title} ({s.course?.code})</option>
            ))}
          </Select>
        </div>
      </GlassCard>

      {/* Attendance data */}
      {selectedSection && (
        <DataTable
          columns={[
            {
              key: 'date', header: 'Date',
              render: (r) => <span className="text-[13px] font-mono">{formatDateShort((r as { date: string }).date)}</span>,
            },
            {
              key: 'student', header: 'Student',
              render: (r) => <span className="text-[13px]">{(r as { student?: { name: string } }).student?.name ?? '—'}</span>,
            },
            {
              key: 'isPresent', header: 'Status',
              render: (r) => (r as { isPresent: boolean }).isPresent
                ? <Badge variant="success" dot>Present</Badge>
                : <Badge variant="danger" dot>Absent</Badge>,
              width: '100px',
            },
          ]}
          data={(attendanceData ?? []) as unknown as Record<string, unknown>[]}
          loading={isLoading}
          emptyMessage="No attendance records for this section."
        />
      )}

      {/* Mark Attendance Modal */}
      {selectedSection && (
        <MarkAttendanceModal
          open={showMark}
          onClose={() => setShowMark(false)}
          sectionId={selectedSection}
        />
      )}
    </div>
  );
}

// ─── Mark Attendance Modal ─────────────────────────────────────────────────────
function MarkAttendanceModal({ open, onClose, sectionId }: { open: boolean; onClose: () => void; sectionId: string }) {
  const qc = useQueryClient();
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [attendance, setAttendance] = useState<Record<string, boolean>>({});

  // Use enrollment list from different endpoint
  const { data: enrollmentList = [] } = useQuery({
    queryKey: ['enrollment-all'],
    queryFn: () => enrollmentApi.all().then((all: Enrollment[]) => all.filter((e) => e.sectionId === sectionId && e.status === 'ENROLLED')),
    enabled: open,
  });

  const bulkMutation = useMutation({
    mutationFn: (payload: { sectionId: string; date: string; attendances: Array<{ studentId: string; isPresent: boolean }> }) =>
      academicApi.bulkAttendance(payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['attendance-section', sectionId] }); toast.success('Attendance recorded'); onClose(); },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const toggle = (id: string) => setAttendance((p) => ({ ...p, [id]: !p[id] }));

  const submit = () => {
    const attendances = (enrollmentList as Enrollment[]).map((e) => ({
      studentId: e.studentId,
      isPresent: attendance[e.studentId] ?? true,
    }));
    bulkMutation.mutate({ sectionId, date, attendances });
  };

  return (
    <Modal open={open} onClose={onClose} title="Mark Attendance" size="md"
      footer={<><Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button><Button size="sm" loading={bulkMutation.isPending} onClick={submit}>Save Attendance</Button></>}>
      <div className="space-y-4">
        <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        {enrollmentList.length === 0 ? (
          <p className="text-center py-4 text-sm text-gray-400 dark:text-gray-600">No enrolled students found.</p>
        ) : (
          <ul className="space-y-2 max-h-[50vh] overflow-y-auto">
            {(enrollmentList as Enrollment[]).map((e) => {
              const isPresent = attendance[e.studentId] ?? true;
              return (
                <li key={e.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.02]">
                  <p className="flex-1 text-[13px] text-gray-900 dark:text-white">{e.student?.name ?? e.studentId.slice(0, 8)}</p>
                  <button onClick={() => toggle(e.studentId)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-medium transition-all ${isPresent ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20' : 'bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20'}`}>
                    {isPresent ? <><Check size={12} />Present</> : <><X size={12} />Absent</>}
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
