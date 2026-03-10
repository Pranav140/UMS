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
import { DataTable } from '@/components/ui/table';
import { Modal } from '@/components/ui/modal';
import { getErrorMessage, GRADE_COLORS, GRADE_LETTERS } from '@/lib/utils';
import { Plus, Award } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Enrollment, Grade, Section } from '@/types';

export default function GradesPage() {
  const { isStudent, isFaculty, isAdmin, user } = useAuthStore();
  if (isStudent()) return <StudentGrades studentId={user!.id} />;
  if (isFaculty() || isAdmin()) return <FacultyGrades />;
  return null;
}

// ─── Student view ──────────────────────────────────────────────────────────────
function StudentGrades({ studentId }: { studentId: string }) {
  const { data: grades = [], isLoading } = useQuery({
    queryKey: ['grades-student', studentId],
    queryFn: () => academicApi.gradesByStudent(studentId),
  });

  const finalized = (grades as Grade[]).filter((g) => g.status === 'FINALIZED');
  const drafts = (grades as Grade[]).filter((g) => g.status === 'DRAFT');

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Grades" description="Your academic grade records" />

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-16 rounded-2xl bg-white/80 dark:bg-white/[0.04] animate-pulse" />)}</div>
      ) : grades.length === 0 ? (
        <GlassCard className="text-center py-12 text-sm text-gray-400 dark:text-gray-600">No grades recorded yet.</GlassCard>
      ) : (
        <>
          {finalized.length > 0 && (
            <GlassCard>
              <h3 className="text-[15px] font-semibold text-gray-900 dark:text-white mb-4">Finalized Grades</h3>
              <ul className="space-y-2">
                {finalized.map((g) => (
                  <li key={g.id} className="flex items-center gap-3 py-2.5 border-b border-black/[0.04] dark:border-white/[0.05] last:border-0">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                      <Award size={16} className="text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-gray-900 dark:text-white truncate">{g.section?.course?.title ?? '—'}</p>
                      <p className="text-[11px] text-gray-500 dark:text-gray-500 font-mono">{g.section?.course?.code} · Score: {g.score ?? '—'}</p>
                    </div>
                    <span className={`text-[24px] font-bold ${GRADE_COLORS[g.letter ?? ''] ?? ''}`}>{g.letter ?? '—'}</span>
                  </li>
                ))}
              </ul>
            </GlassCard>
          )}
          {drafts.length > 0 && (
            <GlassCard>
              <h3 className="text-[15px] font-semibold text-gray-900 dark:text-white mb-4">Pending Grades</h3>
              <ul className="space-y-2">
                {drafts.map((g) => (
                  <li key={g.id} className="flex items-center gap-3 py-2 border-b border-black/[0.04] dark:border-white/[0.05] last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-gray-900 dark:text-white truncate">{g.section?.course?.title ?? '—'}</p>
                    </div>
                    <Badge variant="warning">Draft</Badge>
                  </li>
                ))}
              </ul>
            </GlassCard>
          )}
        </>
      )}
    </div>
  );
}

// ─── Faculty / Admin view ──────────────────────────────────────────────────────
function FacultyGrades() {
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
  const [showBulk, setShowBulk] = useState(false);

  // Auto-select first section once sections have loaded
  useEffect(() => {
    if (!selectedSection && sectionList.length > 0) {
      setSelectedSection(sectionList[0].id);
    }
  }, [sectionList, selectedSection]);

  const { data: grades = [], isLoading } = useQuery({
    queryKey: ['grades-section', selectedSection],
    queryFn: () => academicApi.gradesBySection(selectedSection),
    enabled: !!selectedSection,
  });

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Grades" description="Enter and manage student grades"
        action={<Button icon={<Plus size={16} />} onClick={() => setShowBulk(true)}>Bulk Entry</Button>}
      />

      <GlassCard padding="sm">
        <Select value={selectedSection} onChange={(e) => setSelectedSection(e.target.value)}>
          <option value="">Select section</option>
          {sectionList.map((s) => <option key={s.id} value={s.id}>{s.course?.title} ({s.course?.code})</option>)}
        </Select>
      </GlassCard>

      {selectedSection && (
        <DataTable<Grade>
          columns={[
            { key: 'student', header: 'Student', render: (g) => <span className="text-[13px]">{g.student?.name ?? '—'}</span> },
            { key: 'score', header: 'Score', render: (g) => <span className="text-[13px] font-mono">{g.score ?? '—'}</span>, width: '80px' },
            {
              key: 'letter', header: 'Grade',
              render: (g) => <span className={`text-[18px] font-bold ${GRADE_COLORS[g.letter ?? ''] ?? ''}`}>{g.letter ?? '—'}</span>,
              width: '80px',
            },
            {
              key: 'status', header: 'Status',
              render: (g) => <Badge variant={g.status === 'FINALIZED' ? 'success' : 'warning'}>{g.status}</Badge>,
              width: '100px',
            },
          ]}
          data={grades as Grade[]}
          loading={isLoading}
          emptyMessage="No grades for this section yet."
          rowKey={(g) => g.id}
        />
      )}

      {selectedSection && (
        <BulkGradeModal open={showBulk} onClose={() => setShowBulk(false)} sectionId={selectedSection} />
      )}
    </div>
  );
}

// ─── Bulk Grade Modal ─────────────────────────────────────────────────────────
function BulkGradeModal({ open, onClose, sectionId }: { open: boolean; onClose: () => void; sectionId: string }) {
  const qc = useQueryClient();
  const [grades, setGrades] = useState<Array<{ studentId: string; name: string; score: string; letter: string; status: string }>>([]);

  const { data: enrollments = [] } = useQuery({
    queryKey: ['enrollment-section', sectionId],
    queryFn: () => enrollmentApi.bySection(sectionId),
    enabled: open && !!sectionId,
  });

  // Initialize grade rows when enrollments load (or when modal re-opens)
  useEffect(() => {
    if (open && (enrollments as Enrollment[]).length > 0) {
      setGrades((enrollments as Enrollment[]).map((e) => ({
        studentId: e.studentId,
        name: e.student?.name ?? e.studentId.slice(0, 8),
        score: '',
        letter: 'B',
        status: 'DRAFT',
      })));
    }
    if (!open) {
      setGrades([]);
    }
  }, [open, enrollments]);

  const { mutate, isPending } = useMutation({
    mutationFn: (payload: { sectionId: string; grades: Array<{ studentId: string; score: number; letter: string; status: string }> }) =>
      academicApi.bulkGrades(payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['grades-section', sectionId] }); toast.success('Grades saved'); onClose(); },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const update = (i: number, k: string, v: string) => setGrades((p) => p.map((g, idx) => idx === i ? { ...g, [k]: v } : g));

  return (
    <Modal open={open} onClose={onClose} title="Bulk Grade Entry" size="xl"
      footer={<><Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button><Button size="sm" loading={isPending} onClick={() => mutate({ sectionId, grades: grades.map((g) => ({ studentId: g.studentId, score: Number(g.score) || 0, letter: g.letter, status: g.status })) })}>Save All Grades</Button></>}>
      {grades.length === 0 ? (
        <p className="text-center py-6 text-sm text-gray-400 dark:text-gray-600">No enrolled students found.</p>
      ) : (
        <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-12 gap-2 px-1 mb-1">
            <p className="col-span-4 text-[11px] font-semibold text-gray-500 dark:text-gray-500 uppercase tracking-wide">Student</p>
            <p className="col-span-3 text-[11px] font-semibold text-gray-500 dark:text-gray-500 uppercase tracking-wide">Score</p>
            <p className="col-span-3 text-[11px] font-semibold text-gray-500 dark:text-gray-500 uppercase tracking-wide">Grade</p>
            <p className="col-span-2 text-[11px] font-semibold text-gray-500 dark:text-gray-500 uppercase tracking-wide">Status</p>
          </div>
          {grades.map((g, i) => (
            <div key={g.studentId} className="grid grid-cols-12 gap-2 items-center">
              <p className="col-span-4 text-[13px] font-medium text-gray-900 dark:text-white truncate">{g.name}</p>
              <div className="col-span-3">
                <input type="number" min="0" max="100" value={g.score} onChange={(e) => update(i, 'score', e.target.value)} placeholder="0–100"
                  className="w-full h-9 px-2.5 text-sm rounded-lg bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.08] dark:border-white/[0.10] text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-[#0071E3]/15 dark:focus:ring-[#0A84FF]/15" />
              </div>
              <div className="col-span-3">
                <select value={g.letter} onChange={(e) => update(i, 'letter', e.target.value)}
                  className="w-full h-9 px-2.5 text-sm rounded-lg bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.08] dark:border-white/[0.10] text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-[#0071E3]/15">
                  {GRADE_LETTERS.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <select value={g.status} onChange={(e) => update(i, 'status', e.target.value)}
                  className="w-full h-9 px-2.5 text-[12px] rounded-lg bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.08] dark:border-white/[0.10] text-gray-900 dark:text-gray-100 outline-none">
                  <option value="DRAFT">Draft</option>
                  <option value="FINALIZED">Final</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
