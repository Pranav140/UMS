import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { enrollmentApi, sectionsApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { PageHeader } from '@/components/layout/page-header';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { getErrorMessage } from '@/lib/utils';
import { BookOpen, Plus, X, Users, Award } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Enrollment, Section } from '@/types';

export default function MyCoursesPage() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [showBrowse, setShowBrowse] = useState(false);
  const [confirmDrop, setConfirmDrop] = useState<Enrollment | null>(null);

  const { data: enrollments = [], isLoading } = useQuery({
    queryKey: ['my-enrollments'],
    queryFn: enrollmentApi.myEnrollments,
  });

  const active = enrollments.filter((e: Enrollment) => e.status === 'ENROLLED');
  const dropped = enrollments.filter((e: Enrollment) => e.status === 'DROPPED');

  const dropMutation = useMutation({
    mutationFn: (sectionId: string) => enrollmentApi.drop(sectionId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['my-enrollments'] }); toast.success('Course dropped'); setConfirmDrop(null); },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="My Courses"
        description="Your enrolled courses for the current semester"
        action={<Button icon={<Plus size={16} />} onClick={() => setShowBrowse(true)}>Browse Courses</Button>}
      />

      {/* Active enrollments */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-white/80 dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.08] animate-pulse" />
          ))}
        </div>
      ) : active.length === 0 ? (
        <GlassCard className="text-center py-12">
          <BookOpen size={32} className="mx-auto text-gray-300 dark:text-gray-700 mb-3" />
          <p className="text-[14px] font-medium text-gray-500 dark:text-gray-500">No active enrollments</p>
          <p className="text-sm text-gray-400 dark:text-gray-600 mt-1">Browse available courses to enroll.</p>
          <Button className="mt-4" size="sm" icon={<Plus size={14} />} onClick={() => setShowBrowse(true)}>Browse Courses</Button>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {active.map((e: Enrollment) => (
            <GlassCard key={e.id} className="group">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#0071E3]/10 dark:bg-[#0A84FF]/10 flex items-center justify-center shrink-0">
                  <BookOpen size={18} className="text-[#0071E3] dark:text-[#0A84FF]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-gray-900 dark:text-white truncate">{e.section?.course?.title ?? '—'}</p>
                  <p className="text-[12px] text-gray-500 dark:text-gray-500 font-mono">{e.section?.course?.code}</p>
                  <p className="text-[12px] text-gray-500 dark:text-gray-500 mt-1">{e.section?.faculty?.user?.name ?? 'No faculty assigned'}</p>
                </div>
                <button
                  onClick={() => setConfirmDrop(e)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-500/10 transition-all"
                >
                  <X size={14} />
                </button>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <Badge variant="success" dot>Enrolled</Badge>
                <Badge variant="neutral"><Award size={10} className="mr-1" />{e.section?.course?.credits ?? 0} credits</Badge>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* Dropped courses */}
      {dropped.length > 0 && (
        <>
          <h3 className="text-[13px] font-semibold text-gray-500 dark:text-gray-500 uppercase tracking-wide">Dropped</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {dropped.map((e: Enrollment) => (
              <GlassCard key={e.id} padding="sm" className="opacity-60">
                <p className="text-[13px] font-medium text-gray-700 dark:text-gray-300">{e.section?.course?.title ?? '—'}</p>
                <p className="text-[11px] text-gray-500 dark:text-gray-500 font-mono mt-0.5">{e.section?.course?.code}</p>
              </GlassCard>
            ))}
          </div>
        </>
      )}

      {/* Browse Modal */}
      <BrowseCoursesModal open={showBrowse} onClose={() => setShowBrowse(false)} enrolledSectionIds={active.map((e: Enrollment) => e.sectionId)} />

      {/* Drop confirm */}
      <Modal open={!!confirmDrop} onClose={() => setConfirmDrop(null)} title="Drop Course"
        description={`Drop "${confirmDrop?.section?.course?.title}"? You can re-enroll if capacity allows.`} size="sm"
        footer={<><Button variant="secondary" size="sm" onClick={() => setConfirmDrop(null)}>Cancel</Button><Button variant="danger" size="sm" loading={dropMutation.isPending} onClick={() => confirmDrop && dropMutation.mutate(confirmDrop.sectionId)}>Drop Course</Button></>}>
        <div />
      </Modal>
    </div>
  );
}

function BrowseCoursesModal({ open, onClose, enrolledSectionIds }: { open: boolean; onClose: () => void; enrolledSectionIds: string[] }) {
  const qc = useQueryClient();
  const { data: available = [], isLoading } = useQuery({
    queryKey: ['sections-available'],
    queryFn: sectionsApi.available,
    enabled: open,
  });

  const registerMutation = useMutation({
    mutationFn: (sectionId: string) => enrollmentApi.register(sectionId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['my-enrollments'] }); qc.invalidateQueries({ queryKey: ['sections-available'] }); toast.success('Enrolled successfully'); },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  return (
    <Modal open={open} onClose={onClose} title="Available Courses" description="Browse and enroll in courses for the active semester" size="lg">
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-gray-100 dark:bg-white/[0.04] animate-pulse" />
          ))}
        </div>
      ) : available.length === 0 ? (
        <p className="text-center py-8 text-sm text-gray-400 dark:text-gray-600">No available sections in the active semester.</p>
      ) : (
        <ul className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
          {(available as Section[]).map((s) => {
            const isEnrolled = enrolledSectionIds.includes(s.id);
            const isFull = (s._count?.enrollments ?? 0) >= s.capacity;
            return (
              <li key={s.id} className="flex items-center gap-3 p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.05] dark:border-white/[0.06]">
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-gray-900 dark:text-white truncate">{s.course?.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] font-mono text-gray-500 dark:text-gray-500">{s.course?.code}</span>
                    <span className="text-[11px] text-gray-400 dark:text-gray-600">·</span>
                    <span className="text-[11px] text-gray-500 dark:text-gray-500">{s.faculty?.user?.name ?? 'TBA'}</span>
                    <span className="text-[11px] text-gray-400 dark:text-gray-600">·</span>
                    <span className="text-[11px] text-gray-500 dark:text-gray-500 flex items-center gap-0.5"><Users size={10} />{s._count?.enrollments}/{s.capacity}</span>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant={isEnrolled ? 'secondary' : 'primary'}
                  disabled={isEnrolled || isFull}
                  onClick={() => registerMutation.mutate(s.id)}
                  loading={registerMutation.isPending}
                >
                  {isEnrolled ? 'Enrolled' : isFull ? 'Full' : 'Enroll'}
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </Modal>
  );
}
