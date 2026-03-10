import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { semestersApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { PageHeader } from '@/components/layout/page-header';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { getErrorMessage, formatDateShort } from '@/lib/utils';
import { Plus, CalendarDays, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Semester } from '@/types';

export default function SemestersPage() {
  const { isAdmin } = useAuthStore();
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);

  const { data: semesters = [], isLoading } = useQuery({
    queryKey: ['semesters'],
    queryFn: semestersApi.list,
  });

  const activateMutation = useMutation({
    mutationFn: (id: string) => semestersApi.activate(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['semesters'] }); qc.invalidateQueries({ queryKey: ['active-semester'] }); toast.success('Semester activated'); },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  if (!isAdmin()) {
    return <div className="py-20 text-center text-gray-500 dark:text-gray-500">Access restricted to administrators.</div>;
  }

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Semesters"
        description="Manage academic semesters"
        action={<Button icon={<Plus size={16} />} onClick={() => setShowCreate(true)}>New Semester</Button>}
      />

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 rounded-2xl bg-white/80 dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.08] animate-pulse" />
          ))}
        </div>
      ) : semesters.length === 0 ? (
        <GlassCard className="text-center py-12 text-gray-400 dark:text-gray-600 text-sm">No semesters created yet.</GlassCard>
      ) : (
        <div className="space-y-3">
          {semesters.map((s: Semester) => (
            <GlassCard key={s.id} className={s.isActive ? 'border-[#0071E3]/30 dark:border-[#0A84FF]/20' : ''}>
              <div className="flex items-center gap-4">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${s.isActive ? 'bg-[#0071E3]/10 dark:bg-[#0A84FF]/10' : 'bg-gray-100 dark:bg-white/[0.04]'}`}>
                  <CalendarDays size={18} className={s.isActive ? 'text-[#0071E3] dark:text-[#0A84FF]' : 'text-gray-500 dark:text-gray-500'} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-[14px] font-semibold text-gray-900 dark:text-white">{s.name}</h3>
                    {s.isActive && <Badge variant="success" dot>Active</Badge>}
                  </div>
                  <p className="text-[12px] text-gray-500 dark:text-gray-500 mt-0.5">
                    {formatDateShort(s.startDate)} — {formatDateShort(s.endDate)}
                  </p>
                </div>
                {!s.isActive && (
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<Zap size={13} />}
                    loading={activateMutation.isPending}
                    onClick={() => activateMutation.mutate(s.id)}
                  >
                    Activate
                  </Button>
                )}
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      <SemesterModal open={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  );
}

function SemesterModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: '', startDate: '', endDate: '' });

  const { mutate, isPending } = useMutation({
    mutationFn: (p: Record<string, unknown>) => semestersApi.create(p),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['semesters'] }); toast.success('Semester created'); onClose(); setForm({ name: '', startDate: '', endDate: '' }); },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <Modal open={open} onClose={onClose} title="New Semester" size="sm"
      footer={<><Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button><Button size="sm" loading={isPending} onClick={() => mutate({ name: form.name, startDate: new Date(form.startDate).toISOString(), endDate: new Date(form.endDate).toISOString() })}>Create</Button></>}>
      <div className="space-y-3">
        <Input label="Semester Name" placeholder="Spring 2027" value={form.name} onChange={(e) => set('name', e.target.value)} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Start Date" type="date" value={form.startDate} onChange={(e) => set('startDate', e.target.value)} />
          <Input label="End Date" type="date" value={form.endDate} onChange={(e) => set('endDate', e.target.value)} />
        </div>
      </div>
    </Modal>
  );
}
