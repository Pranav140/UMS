import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { enrollmentApi, sectionsApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { PageHeader } from '@/components/layout/page-header';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { getErrorMessage } from '@/lib/utils';
import { useState } from 'react';
import { BookOpen, Plus, X, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Section } from '@/types';

export default function MySectionsPage() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [showClaim, setShowClaim] = useState(false);
  const [confirmRelease, setConfirmRelease] = useState<Section | null>(null);

  const { data: sections = [], isLoading } = useQuery({
    queryKey: ['my-sections'],
    queryFn: enrollmentApi.mySections,
  });

  const releaseMutation = useMutation({
    mutationFn: (sectionId: string) => enrollmentApi.release(sectionId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['my-sections'] }); toast.success('Section released'); setConfirmRelease(null); },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="My Sections"
        description="Sections you are assigned to teach"
        action={<Button icon={<Plus size={16} />} onClick={() => setShowClaim(true)}>Claim Section</Button>}
      />

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 rounded-2xl bg-white/80 dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.08] animate-pulse" />
          ))}
        </div>
      ) : sections.length === 0 ? (
        <GlassCard className="text-center py-12">
          <BookOpen size={32} className="mx-auto text-gray-300 dark:text-gray-700 mb-3" />
          <p className="text-[14px] font-medium text-gray-500 dark:text-gray-500">No sections assigned</p>
          <p className="text-sm text-gray-400 dark:text-gray-600 mt-1">Claim an available section to start teaching.</p>
          <Button className="mt-4" size="sm" icon={<Plus size={14} />} onClick={() => setShowClaim(true)}>Claim Section</Button>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(sections as Section[]).map((s) => (
            <GlassCard key={s.id} className="group">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0">
                  <BookOpen size={18} className="text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-gray-900 dark:text-white truncate">{s.course?.title ?? '—'}</p>
                  <p className="text-[12px] text-gray-500 dark:text-gray-500 font-mono">{s.course?.code}</p>
                </div>
                <button
                  onClick={() => setConfirmRelease(s)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-500/10 transition-all"
                >
                  <X size={14} />
                </button>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <Badge variant="neutral"><Users size={10} className="mr-1" />{s._count?.enrollments ?? 0}/{s.capacity} students</Badge>
                <Badge variant="default">{s.course?.credits} credits</Badge>
              </div>
              <div className="flex gap-2 mt-3">
                <Link to={`/dashboard/attendance?section=${s.id}`} className="flex-1">
                  <Button variant="secondary" size="sm" fullWidth>Mark Attendance</Button>
                </Link>
                <Link to={`/dashboard/grades?section=${s.id}`} className="flex-1">
                  <Button variant="secondary" size="sm" fullWidth>Enter Grades</Button>
                </Link>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      <ClaimModal open={showClaim} onClose={() => setShowClaim(false)} claimedIds={(sections as Section[]).map((s) => s.id)} />

      <Modal open={!!confirmRelease} onClose={() => setConfirmRelease(null)} title="Release Section"
        description={`Release "${confirmRelease?.course?.title}"? You will no longer be assigned to this section.`} size="sm"
        footer={<><Button variant="secondary" size="sm" onClick={() => setConfirmRelease(null)}>Cancel</Button><Button variant="danger" size="sm" loading={releaseMutation.isPending} onClick={() => confirmRelease && releaseMutation.mutate(confirmRelease.id)}>Release</Button></>}>
        <div />
      </Modal>
    </div>
  );
}

function ClaimModal({ open, onClose, claimedIds }: { open: boolean; onClose: () => void; claimedIds: string[] }) {
  const qc = useQueryClient();
  const { data: available = [], isLoading } = useQuery({
    queryKey: ['sections-unassigned'],
    queryFn: sectionsApi.available,
    enabled: open,
  });

  const claimMutation = useMutation({
    mutationFn: (sectionId: string) => enrollmentApi.claim(sectionId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['my-sections'] }); toast.success('Section claimed'); },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const unassigned = (available as Section[]).filter((s) => !s.facultyId);

  return (
    <Modal open={open} onClose={onClose} title="Claim Section" description="Sections without a faculty assignment" size="md">
      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-14 rounded-xl bg-gray-100 dark:bg-white/[0.04] animate-pulse" />)}</div>
      ) : unassigned.length === 0 ? (
        <p className="text-center py-8 text-sm text-gray-400 dark:text-gray-600">No unassigned sections available.</p>
      ) : (
        <ul className="space-y-2 max-h-[50vh] overflow-y-auto">
          {unassigned.map((s) => (
            <li key={s.id} className="flex items-center gap-3 p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.05] dark:border-white/[0.06]">
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-gray-900 dark:text-white truncate">{s.course?.title}</p>
                <p className="text-[11px] font-mono text-gray-500 dark:text-gray-500">{s.course?.code} · {s.capacity} capacity</p>
              </div>
              <Button size="sm" disabled={claimedIds.includes(s.id)} loading={claimMutation.isPending} onClick={() => claimMutation.mutate(s.id)}>
                {claimedIds.includes(s.id) ? 'Claimed' : 'Claim'}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
