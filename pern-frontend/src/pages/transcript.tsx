import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';
import { academicApi } from '@/lib/api';
import { PageHeader } from '@/components/layout/page-header';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { downloadBlob, GRADE_COLORS } from '@/lib/utils';
import { FileText, Download, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import type { GPAData, Grade } from '@/types';

export default function TranscriptPage() {
  const { user, isStudent } = useAuthStore();
  const studentId = user?.id ?? '';
  const [downloading, setDownloading] = useState(false);

  const { data: gpaData, isLoading: loadingGpa } = useQuery<GPAData>({
    queryKey: ['gpa', studentId],
    queryFn: () => academicApi.gpa(studentId),
    enabled: !!studentId && isStudent(),
  });

  const { data: grades = [], isLoading: loadingGrades } = useQuery<Grade[]>({
    queryKey: ['grades-student', studentId],
    queryFn: () => academicApi.gradesByStudent(studentId),
    enabled: !!studentId && isStudent(),
  });

  const isLoading = loadingGpa || loadingGrades;

  // Group finalized grades by semester to show per-course detail
  const gradesBySemester = useMemo(() => {
    const map = new Map<string, Grade[]>();
    for (const g of grades) {
      if (g.status !== 'FINALIZED') continue;
      const semId = g.section?.semesterId ?? 'unknown';
      const list = map.get(semId) ?? [];
      list.push(g);
      map.set(semId, list);
    }
    return map;
  }, [grades]);

  if (!isStudent()) {
    return <div className="py-20 text-center text-gray-500 dark:text-gray-500">Transcripts are only available for students.</div>;
  }

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const blob = await academicApi.transcript(studentId);
      downloadBlob(blob, `transcript_${user?.name?.replace(/\s+/g, '_') ?? studentId}.pdf`);
      toast.success('Transcript downloaded');
    } catch {
      toast.error('Could not generate transcript. Ensure you have finalized grades.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="animate-fade-in max-w-2xl space-y-6">
      <PageHeader
        title="Academic Transcript"
        description="Official academic record with GPA breakdown"
        action={
          <Button
            icon={<Download size={16} />}
            loading={downloading}
            onClick={handleDownload}
          >
            Download PDF
          </Button>
        }
      />

      {/* Overall GPA */}
      <GlassCard className="relative overflow-hidden">
        <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-[#0071E3]/10 dark:bg-[#0A84FF]/05 blur-2xl pointer-events-none" />
        <div className="relative flex items-center gap-6">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#0071E3] to-[#6366F1] flex items-center justify-center shrink-0 shadow-xl shadow-[#0071E3]/20">
            <TrendingUp size={32} className="text-white" />
          </div>
          <div>
            <p className="text-[13px] font-medium text-gray-500 dark:text-gray-500 uppercase tracking-wide">Cumulative GPA</p>
            {loadingGpa ? (
              <div className="mt-1 h-12 w-24 rounded-xl bg-gray-200 dark:bg-white/[0.06] animate-pulse" />
            ) : (
              <p className="text-[48px] font-black text-gray-900 dark:text-white leading-none tracking-tight mt-0.5">
                {gpaData?.cumulativeGPA ?? '0.00'}
              </p>
            )}
            <p className="text-[12px] text-gray-500 dark:text-gray-500 mt-1">
              {loadingGpa ? '…' : `${gpaData?.totalCredits ?? 0} total credits · 10-point scale`}
            </p>
          </div>
        </div>
      </GlassCard>

      {/* Semester breakdown */}
      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-32 rounded-2xl bg-white/80 dark:bg-white/[0.04] animate-pulse" />)}</div>
      ) : !gpaData?.semesterBreakdown?.length ? (
        <GlassCard className="text-center py-12">
          <FileText size={32} className="mx-auto text-gray-300 dark:text-gray-700 mb-3" />
          <p className="text-[14px] font-medium text-gray-500 dark:text-gray-500">No finalized grades</p>
          <p className="text-sm text-gray-400 dark:text-gray-600 mt-1">Your transcript will appear here once grades are finalized by your faculty.</p>
        </GlassCard>
      ) : (
        <div className="space-y-4">
          {gpaData.semesterBreakdown.map((sem) => {
            const semGrades = gradesBySemester.get(sem.semester.id) ?? [];
            return (
              <GlassCard key={sem.semester.id}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-[15px] font-semibold text-gray-900 dark:text-white">{sem.semester.name}</h3>
                    <p className="text-[12px] text-gray-500 dark:text-gray-500 mt-0.5">{sem.credits} credits</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[22px] font-bold text-[#0071E3] dark:text-[#0A84FF]">{sem.gpa}</p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-500">SGPA</p>
                  </div>
                </div>
                {semGrades.length > 0 && (
                  <ul className="space-y-2">
                    {semGrades.map((g) => (
                      <li key={g.id} className="flex items-center gap-3 py-2 border-b border-black/[0.04] dark:border-white/[0.05] last:border-0">
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-medium text-gray-900 dark:text-white truncate">{g.section?.course?.title ?? '—'}</p>
                          <p className="text-[11px] text-gray-500 dark:text-gray-500 font-mono">{g.section?.course?.code} · {g.section?.course?.credits} cr</p>
                        </div>
                        <div className="text-right">
                          <span className={`text-[20px] font-bold ${GRADE_COLORS[g.letter ?? ''] ?? ''}`}>{g.letter ?? '—'}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </GlassCard>
            );
          })}
        </div>
      )}

      <p className="text-[11px] text-gray-400 dark:text-gray-600 text-center">
        PDF transcript is generated from finalized grades only.
      </p>
    </div>
  );
}
