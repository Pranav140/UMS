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
import { getErrorMessage, cn, GRADE_COLORS } from '@/lib/utils';
import { Plus, Award, BarChart2, TrendingUp, BookOpen, Layers } from 'lucide-react';
import type { Enrollment, Grade, Section, CourseType } from '@/types';
import toast from 'react-hot-toast';

export default function GradesPage() {
  const { isStudent, isFaculty, isAdmin, user } = useAuthStore();
  if (isStudent()) return <StudentGrades studentId={user!.id} />;
  if (isFaculty() || isAdmin()) return <FacultyGrades />;
  return null;
}

// ─── Grade Distribution Chart Component ──────────────────────────────────────
interface GradeDistributionChartProps {
  grades: Grade[];
  title?: string;
  subtitle?: string;
}

function GradeDistributionChart({ grades, title = 'Grade Distribution', subtitle = 'Letter grades allocation' }: GradeDistributionChartProps) {
  const finalized = grades.filter((g) => g.status === 'FINALIZED' && g.letter);
  if (finalized.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-black/[0.01] dark:bg-white/[0.01] border border-dashed border-black/[0.08] dark:border-white/[0.1] text-gray-400 dark:text-gray-600">
        <BarChart2 size={32} className="mb-2 opacity-50" />
        <span className="text-[12px]">No finalized grades to display statistics</span>
      </div>
    );
  }

  const counts: Record<string, number> = { S: 0, A: 0, B: 0, C: 0, D: 0, E: 0, F: 0 };
  let sumScore = 0;
  let countScore = 0;
  let maxScore = 0;

  finalized.forEach((g) => {
    if (g.letter && g.letter in counts) {
      counts[g.letter]++;
    }
    if (g.score !== null && g.score !== undefined) {
      sumScore += g.score;
      countScore++;
      if (g.score > maxScore) maxScore = g.score;
    }
  });

  const avgScore = countScore > 0 ? (sumScore / countScore).toFixed(1) : '—';
  const totalGraded = finalized.length;
  const passed = finalized.filter((g) => g.letter !== 'F').length;
  const passRate = totalGraded > 0 ? Math.round((passed / totalGraded) * 100) : 0;

  const maxCount = Math.max(...Object.values(counts), 1);

  const colorsBg: Record<string, string> = {
    S: 'bg-emerald-500',
    A: 'bg-blue-500',
    B: 'bg-sky-500',
    C: 'bg-amber-500',
    D: 'bg-orange-500',
    E: 'bg-red-400',
    F: 'bg-red-600',
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-1">
      {/* Stats Cards */}
      <div className="lg:col-span-1 grid grid-cols-2 gap-3 shrink-0">
        <div className="p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/[0.05]">
          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Avg Score</p>
          <p className="text-[20px] font-bold text-gray-900 dark:text-white mt-1 leading-none">{avgScore}</p>
          <span className="text-[9px] text-gray-400 mt-1 block">out of 100</span>
        </div>
        <div className="p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/[0.05]">
          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Pass Rate</p>
          <p className="text-[20px] font-bold text-emerald-600 dark:text-emerald-400 mt-1 leading-none">{passRate}%</p>
          <span className="text-[9px] text-gray-400 mt-1 block">grades S to E</span>
        </div>
        <div className="p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/[0.05]">
          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Highest</p>
          <p className="text-[20px] font-bold text-indigo-600 dark:text-indigo-400 mt-1 leading-none">{maxScore || '—'}</p>
          <span className="text-[9px] text-gray-400 mt-1 block">top evaluation</span>
        </div>
        <div className="p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/[0.05]">
          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Total Graded</p>
          <p className="text-[20px] font-bold text-gray-900 dark:text-white mt-1 leading-none">{totalGraded}</p>
          <span className="text-[9px] text-gray-400 mt-1 block">students finalized</span>
        </div>
      </div>

      {/* Distribution Chart */}
      <div className="lg:col-span-2 p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/[0.05] flex flex-col justify-between">
        <div>
          <h4 className="text-[13px] font-bold text-gray-800 dark:text-gray-200 mb-1">{title}</h4>
          <p className="text-[10px] text-gray-500 mb-3">{subtitle}</p>
          <div className="space-y-1.5">
            {Object.entries(counts).map(([letter, count]) => {
              const pct = Math.round((count / maxCount) * 100);
              const labelPct = totalGraded > 0 ? Math.round((count / totalGraded) * 100) : 0;
              return (
                <div key={letter} className="flex items-center gap-3">
                  <span className="w-5 text-[11px] font-bold text-gray-700 dark:text-gray-300 text-center">{letter}</span>
                  <div className="flex-1">
                    <div className="h-2 rounded-full bg-black/[0.04] dark:bg-white/[0.06] overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all duration-1000", colorsBg[letter] || "bg-gray-500")}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-gray-500 w-12 text-right">
                    {count} <span className="text-[9px] opacity-75 font-normal">({labelPct}%)</span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
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
      <PageHeader title="Grades" description="Your academic grade records and performance stats" />

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 rounded-2xl bg-white/80 dark:bg-white/[0.04] animate-pulse" />
          ))}
        </div>
      ) : grades.length === 0 ? (
        <GlassCard className="text-center py-12 text-sm text-gray-400 dark:text-gray-600">
          No grades recorded yet.
        </GlassCard>
      ) : (
        <>
          {/* Grade Distribution & Stats Visuals */}
          {finalized.length > 0 && (
            <GlassCard>
              <h3 className="text-[15px] font-bold text-gray-900 dark:text-white mb-4">Academic Grading Analytics</h3>
              <GradeDistributionChart
                grades={grades}
                title="Your Grade Distribution"
                subtitle="Frequency of your letter grades"
              />
            </GlassCard>
          )}

          {/* Finalized Grades List */}
          {finalized.length > 0 && (
            <GlassCard>
              <h3 className="text-[15px] font-semibold text-gray-900 dark:text-white mb-4">Finalized Grades</h3>
              <ul className="space-y-3">
                {finalized.map((g) => (
                  <li key={g.id} className="flex items-center gap-3 p-3 rounded-2xl bg-black/[0.01] dark:bg-white/[0.01] border border-black/[0.03] dark:border-white/[0.04] hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-all">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                      <Award size={16} className="text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-gray-900 dark:text-white truncate">{g.section?.course?.title ?? '—'}</p>
                      <p className="text-[11px] text-gray-500 dark:text-gray-500">
                        {g.section?.course?.code} · Final Score: {g.score ?? '—'} / 100
                      </p>
                    </div>
                    <span className={`text-[22px] font-black tracking-tight shrink-0 ${GRADE_COLORS[g.letter ?? ''] ?? 'text-gray-400'}`}>
                      {g.letter ?? '—'}
                    </span>
                  </li>
                ))}
              </ul>
            </GlassCard>
          )}

          {/* Draft/Pending Grades */}
          {drafts.length > 0 && (
            <GlassCard>
              <h3 className="text-[15px] font-semibold text-gray-900 dark:text-white mb-4">Pending Evaluations</h3>
              <ul className="space-y-2">
                {drafts.map((g) => (
                  <li key={g.id} className="flex items-center gap-3 p-2.5 rounded-2xl bg-black/[0.01] dark:bg-white/[0.01] border border-black/[0.03] dark:border-white/[0.04]">
                    <div className="w-8 h-8 rounded-lg bg-gray-500/10 flex items-center justify-center shrink-0">
                      <BookOpen size={14} className="text-gray-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-gray-900 dark:text-white truncate">{g.section?.course?.title ?? '—'}</p>
                      <p className="text-[11px] text-gray-500">{g.section?.course?.code}</p>
                    </div>
                    <Badge variant="warning">In Evaluation</Badge>
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

  const sectionInfo = sectionList.find((s) => s.id === selectedSection);

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Grades"
        description="Enter, analyze, and manage student grades"
        action={
          selectedSection && (
            <Button icon={<Plus size={16} />} onClick={() => setShowBulk(true)}>
              Bulk Entry
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
          {/* Section Grade Distribution Chart */}
          <GlassCard>
            <div className="flex items-center gap-2 mb-4">
              <BarChart2 size={18} className="text-[#0071E3] dark:text-[#0A84FF]" />
              <h3 className="text-[15px] font-bold text-gray-900 dark:text-white">Section Analytics</h3>
            </div>
            {isLoading ? (
              <div className="h-40 bg-gray-100 dark:bg-white/[0.04] animate-pulse rounded-2xl" />
            ) : (
              <GradeDistributionChart
                grades={grades}
                title={`${sectionInfo?.course?.title ?? 'Course'} (${sectionInfo?.sectionCode ?? ''})`}
                subtitle="Overall grade distribution for this section"
              />
            )}
          </GlassCard>

          {/* Detailed Grades List Table */}
          <GlassCard>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Layers size={18} className="text-purple-600 dark:text-purple-400" />
                <h3 className="text-[15px] font-bold text-gray-900 dark:text-white">Grading Roster</h3>
              </div>
            </div>
            <DataTable<Grade>
              columns={[
                {
                  key: 'student',
                  header: 'Student',
                  render: (g) => <span className="text-[13px] font-semibold text-gray-800 dark:text-gray-200">{g.student?.name ?? '—'}</span>,
                },
                {
                  key: 'score',
                  header: 'Calculated Score',
                  render: (g) => <span className="text-[13px] font-mono font-bold text-gray-900 dark:text-white">{g.score ?? '—'}</span>,
                  width: '140px',
                },
                {
                  key: 'letter',
                  header: 'Grade Letter',
                  render: (g) => (
                    <span className={`text-[18px] font-extrabold ${GRADE_COLORS[g.letter ?? ''] ?? 'text-gray-400'}`}>
                      {g.letter ?? '—'}
                    </span>
                  ),
                  width: '100px',
                },
                {
                  key: 'status',
                  header: 'Status',
                  render: (g) => (
                    <Badge variant={g.status === 'FINALIZED' ? 'success' : 'warning'}>
                      {g.status}
                    </Badge>
                  ),
                  width: '120px',
                },
              ]}
              data={grades as Grade[]}
              loading={isLoading}
              emptyMessage="No grades entered for this section yet. Click 'Bulk Entry' to record grades."
              rowKey={(g) => g.id}
            />
          </GlassCard>
        </>
      )}

      {selectedSection && (
        <BulkGradeModal open={showBulk} onClose={() => setShowBulk(false)} sectionId={selectedSection} />
      )}
    </div>
  );
}

const COURSE_RUBRICS: Record<CourseType, { key: string; label: string; max: number }[]> = {
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
  ],
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

      setGrades(
        (enrollments as Enrollment[]).map((e) => {
          const ex = existing[e.studentId] || {};
          return {
            studentId: e.studentId,
            name: e.student?.name ?? e.studentId.slice(0, 8),
            theoryCa: ex.theoryCa ?? '',
            theoryMt: ex.theoryMt ?? '',
            theoryEs: ex.theoryEs ?? '',
            labCa: ex.labCa ?? '',
            labFr: ex.labFr ?? '',
            labEs: ex.labEs ?? '',
            projectCa: ex.projectCa ?? '',
            projectMr: ex.projectMr ?? '',
            projectEs: ex.projectEs ?? '',
            status: ex.status || 'DRAFT',
          };
        })
      );
    }
    if (!open) setGrades([]);
  }, [open, enrollments, sectionInfo]);

  const { mutate, isPending } = useMutation({
    mutationFn: (payload: { sectionId: string; grades: any[] }) => academicApi.bulkGrades(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['grades-section', sectionId] });
      toast.success('Grades saved');
      onClose();
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const update = (i: number, k: string, v: string) =>
    setGrades((p) => p.map((g, idx) => (idx === i ? { ...g, [k]: v } : g)));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Bulk Grade Entry"
      size="xl"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            loading={isPending}
            onClick={() =>
              mutate({
                sectionId,
                grades: grades.map((g) => ({
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
                })),
              })
            }
          >
            Save & Auto-Calculate
          </Button>
        </>
      }
    >
      {grades.length === 0 ? (
        <p className="text-center py-6 text-sm text-gray-400 dark:text-gray-600">No enrolled students found.</p>
      ) : (
        <div className="space-y-4 max-h-[60vh] overflow-y-auto overflow-x-auto pr-1 pb-4">
          <div className="flex bg-black/[0.04] dark:bg-white/[0.04] p-3 rounded-xl border border-black/[0.05] dark:border-white/[0.05] min-w-max">
            <div className="flex-1 text-[12px] font-semibold uppercase tracking-wide text-gray-500 w-48 shrink-0">
              Student
            </div>
            <div className="flex gap-2 shrink-0">
              {rubrics.map((r) => (
                <div
                  key={r.key}
                  className="w-20 shrink-0 text-[10px] font-semibold uppercase text-center text-gray-500 leading-tight"
                >
                  {r.label}
                </div>
              ))}
              <div className="w-24 shrink-0 text-[12px] font-semibold uppercase text-center text-gray-500">Status</div>
            </div>
          </div>

          {grades.map((g, i) => (
            <div
              key={g.studentId}
              className="flex items-center px-2 py-1 border-b border-black/[0.02] dark:border-white/[0.02] min-w-max"
            >
              <p className="flex-1 text-[13px] font-medium text-gray-900 dark:text-white truncate pr-4 w-48 shrink-0">
                {g.name}
              </p>
              <div className="flex gap-2 items-center shrink-0">
                {rubrics.map((r) => (
                  <input
                    key={r.key}
                    type="number"
                    min="0"
                    max={r.max}
                    value={g[r.key]}
                    onChange={(e) => update(i, r.key, e.target.value)}
                    placeholder={`/${r.max}`}
                    className="w-20 shrink-0 h-9 px-2 text-center text-sm rounded-lg bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.08] dark:border-white/[0.10] outline-none focus:bg-white focus:ring-2 focus:ring-[#0071E3]/20 transition-all cursor-text text-black dark:text-white"
                  />
                ))}
                <select
                  value={g.status}
                  onChange={(e) => update(i, 'status', e.target.value)}
                  className="w-24 shrink-0 h-9 px-2 text-[12px] rounded-lg bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.08] dark:border-white/[0.10] outline-none focus:ring-2 focus:ring-[#0071E3]/20 cursor-pointer text-black dark:text-white"
                >
                  <option value="DRAFT">Draft</option>
                  <option value="FINALIZED">Final</option>
                </select>
              </div>
            </div>
          ))}
          <p className="text-[11px] text-gray-400 mt-4 px-2 italic text-right">
            *Final composite score and letter grade are automatically generated securely during save.
          </p>
        </div>
      )}
    </Modal>
  );
}
