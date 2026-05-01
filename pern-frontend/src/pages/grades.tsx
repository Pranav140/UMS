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
import { getErrorMessage, GRADE_COLORS } from '@/lib/utils';
import { Plus, Award } from 'lucide-react';
import type { Enrollment, Grade, Section, CourseType } from '@/types';
import toast from 'react-hot-toast';

export default function GradesPage() {
  const { isStudent, isFaculty, isAdmin, user } = useAuthStore();
  if (isStudent()) return <StudentGrades studentId={user!.id} />;
  if (isFaculty() || isAdmin()) return <FacultyGrades />;
  return null;
}

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
                      <p className="text-[11px] text-gray-500 dark:text-gray-500 font-mono">
                        {g.section?.course?.code} · Score: {g.score ?? '—'}
                      </p>
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

function FacultyGrades() {
  const [params] = useSearchParams();
  const defaultSection = params.get('section') ?? '';
  const { isFaculty } = useAuthStore();

  const { data: sections = [] } = useQuery({
    queryKey: isFaculty() ? ['my-sections'] : ['all-enrollments-admin'],
    queryFn: () => (isFaculty() ? enrollmentApi.mySections() : enrollmentApi.all()) as Promise<unknown[]>,
  });

  const sectionList: Section[] = isFaculty()
    ? (sections as Section[])
    : [...new Map((sections as { section: Section }[]).map((e) => [e.section?.id, e.section])).values()].filter(Boolean) as Section[];

  const [selectedSection, setSelectedSection] = useState(defaultSection || (sectionList[0]?.id ?? ''));
  const [showBulk, setShowBulk] = useState(false);

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
            { key: 'score', header: 'Final Score', render: (g) => <span className="text-[13px] font-mono font-semibold">{g.score ?? '—'}</span>, width: '120px' },
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

const COURSE_RUBRICS: Record<CourseType, { key: string, label: string, max: number }[]> = {
  THEORY: [
    { key: 'theoryCa', label: 'Continuous (20)', max: 20 },
    { key: 'theoryMt', label: 'Mid-Term (30)', max: 30 },
    { key: 'theoryEs', label: 'End Sem (50)', max: 50 },
  ],
  LAB: [
    { key: 'labCa', label: 'Cont. & Demo (40)', max: 40 },
    { key: 'labFr', label: 'File/Record (10)', max: 10 },
    { key: 'labEs', label: 'End Sem Viva (50)', max: 50 },
  ],
  THEORY_LAB: [
    { key: 'theoryCa', label: 'Th. CA (20)', max: 20 },
    { key: 'theoryMt', label: 'Th. Mid (30)', max: 30 },
    { key: 'theoryEs', label: 'Th. End (50)', max: 50 },
    { key: 'labCa', label: 'Lab CA (40)', max: 40 },
    { key: 'labFr', label: 'Lab File (10)', max: 10 },
    { key: 'labEs', label: 'Lab End (50)', max: 50 },
  ],
  PROJECT: [
    { key: 'projectCa', label: 'Sup. Cont. (20)', max: 20 },
    { key: 'projectMr', label: 'Mid Review (40)', max: 40 },
    { key: 'projectEs', label: 'Viv-Voce (40)', max: 40 },
  ]
};

function BulkGradeModal({ open, onClose, sectionId }: { open: boolean; onClose: () => void; sectionId: string }) {
  const qc = useQueryClient();
  const [grades, setGrades] = useState<any[]>([]);

  const { data: sectionInfo } = useQuery({
    queryKey: ['section-info', sectionId],
    queryFn: () => academicApi.gradesBySection(sectionId),
    enabled: open && !!sectionId,
  });

  const { data: enrollments = [] } = useQuery({
    queryKey: ['enrollment-section', sectionId],
    queryFn: () => enrollmentApi.bySection(sectionId),
    enabled: open && !!sectionId,
  });

  const courseType = (enrollments as any)?.[0]?.section?.course?.type ?? 'THEORY';
  const rubrics = COURSE_RUBRICS[courseType as CourseType] || COURSE_RUBRICS.THEORY;

  useEffect(() => {
    if (open && (enrollments as Enrollment[]).length > 0) {
      const existing = (sectionInfo || []).reduce((acc: any, g: any) => {
        acc[g.studentId] = g;
        return acc;
      }, {});

      setGrades((enrollments as Enrollment[]).map((e) => {
        const ex = existing[e.studentId] || {};
        return {
          studentId: e.studentId,
          name: e.student?.name ?? e.studentId.slice(0, 8),
          theoryCa: ex.theoryCa ?? '', theoryMt: ex.theoryMt ?? '', theoryEs: ex.theoryEs ?? '',
          labCa: ex.labCa ?? '', labFr: ex.labFr ?? '', labEs: ex.labEs ?? '',
          projectCa: ex.projectCa ?? '', projectMr: ex.projectMr ?? '', projectEs: ex.projectEs ?? '',
          status: ex.status || 'DRAFT',
        };
      }));
    }
    if (!open) setGrades([]);
  }, [open, enrollments, sectionInfo]);

  const { mutate, isPending } = useMutation({
    mutationFn: (payload: { sectionId: string; grades: any[] }) => academicApi.bulkGrades(payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['grades-section', sectionId] }); toast.success('Grades saved'); onClose(); },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const update = (i: number, k: string, v: string) => setGrades((p) => p.map((g, idx) => idx === i ? { ...g, [k]: v } : g));

  return (
    <Modal open={open} onClose={onClose} title="Bulk Grade Entry" size="xl"
      footer={<><Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button><Button size="sm" loading={isPending} onClick={() => mutate({
        sectionId, grades: grades.map((g) => ({
          studentId: g.studentId,
          theoryCa: g.theoryCa !== '' ? Number(g.theoryCa) : undefined,
          theoryMt: g.theoryMt !== '' ? Number(g.theoryMt) : undefined,
          theoryEs: g.theoryEs !== '' ? Number(g.theoryEs) : undefined,
          labCa: g.labCa !== '' ? Number(g.labCa) : undefined,
          labFr: g.labFr !== '' ? Number(g.labFr) : undefined,
          labEs: g.labEs !== '' ? Number(g.labEs) : undefined,
          projectCa: g.projectCa !== '' ? Number(g.projectCa) : undefined,
          projectMr: g.projectMr !== '' ? Number(g.projectMr) : undefined,
          projectEs: g.projectEs !== '' ? Number(g.projectEs) : undefined,
          status: g.status,
        }))
      })}>Save & Auto-Calculate</Button></>}>
      {grades.length === 0 ? (
        <p className="text-center py-6 text-sm text-gray-400 dark:text-gray-600">No enrolled students found.</p>
      ) : (
        <div className="space-y-4 max-h-[60vh] overflow-y-auto overflow-x-auto pr-1 pb-4">
          <div className="flex bg-black/[0.04] dark:bg-white/[0.04] p-3 rounded-xl border border-black/[0.05] dark:border-white/[0.05] min-w-max">
             <div className="flex-1 text-[12px] font-semibold uppercase tracking-wide text-gray-500 w-48 shrink-0">Student</div>
             <div className="flex gap-2 shrink-0">
                {rubrics.map(r => (
                  <div key={r.key} className="w-20 shrink-0 text-[10px] font-semibold uppercase text-center text-gray-500 leading-tight">{r.label}</div>
                ))}
                <div className="w-24 shrink-0 text-[12px] font-semibold uppercase text-center text-gray-500">Status</div>
             </div>
          </div>
          
          {grades.map((g, i) => (
            <div key={g.studentId} className="flex items-center px-2 py-1 border-b border-black/[0.02] dark:border-white/[0.02] min-w-max">
              <p className="flex-1 text-[13px] font-medium text-gray-900 dark:text-white truncate pr-4 w-48 shrink-0">{g.name}</p>
              <div className="flex gap-2 items-center shrink-0">
                {rubrics.map(r => (
                  <input key={r.key}
                    type="number" min="0" max={r.max} value={g[r.key]} onChange={(e) => update(i, r.key, e.target.value)} placeholder={`/${r.max}`}
                    className="w-20 shrink-0 h-9 px-2 text-center text-sm rounded-lg bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.08] dark:border-white/[0.10] outline-none focus:bg-white focus:ring-2 focus:ring-[#0071E3]/20 transition-all cursor-text text-black dark:text-white"
                  />
                ))}
                <select
                  value={g.status} onChange={(e) => update(i, 'status', e.target.value)}
                  className="w-24 shrink-0 h-9 px-2 text-[12px] rounded-lg bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.08] dark:border-white/[0.10] outline-none focus:ring-2 focus:ring-[#0071E3]/20 cursor-pointer text-black dark:text-white"
                >
                  <option value="DRAFT">Draft</option>
                  <option value="FINALIZED">Final</option>
                </select>
              </div>
            </div>
          ))}
          <p className="text-[11px] text-gray-400 mt-4 px-2 italic text-right">*Final composite score and letter grade are automatically generated securely during save.</p>
        </div>
      )}
    </Modal>
  );
}
