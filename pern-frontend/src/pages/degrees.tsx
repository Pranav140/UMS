import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { degreesApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { PageHeader } from '@/components/layout/page-header';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { DataTable } from '@/components/ui/table';
import { getErrorMessage } from '@/lib/utils';
import { Plus, Pencil, Trash2, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Degree } from '@/types';

export default function DegreesPage() {
  const { isAdmin } = useAuthStore();
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [editDegree, setEditDegree] = useState<Degree | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Degree | null>(null);

  const { data: degrees = [], isLoading } = useQuery({
    queryKey: ['degrees'],
    queryFn: () => degreesApi.list(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => degreesApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['degrees'] });
      toast.success('Degree deleted');
      setConfirmDelete(null);
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  if (!isAdmin()) {
    return <div className="py-20 text-center text-gray-500 dark:text-gray-500">Access restricted to administrators.</div>;
  }

  const majors = (degrees as Degree[]).filter((d) => d.isMajor);
  const minors = (degrees as Degree[]).filter((d) => !d.isMajor);

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Programs & Degrees"
        description="Manage major and minor degrees offered by the institute"
        action={<Button icon={<Plus size={16} />} onClick={() => setShowCreate(true)}>New Degree</Button>}
      />

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 rounded-2xl bg-white/80 dark:bg-white/[0.04] animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* Major Degrees */}
          <div className="space-y-3">
            <h2 className="text-[15px] font-semibold text-gray-900 dark:text-white">Major Degrees</h2>
            {majors.length === 0 ? (
              <GlassCard className="text-center py-8 text-sm text-gray-400 dark:text-gray-600">No major degrees created yet</GlassCard>
            ) : (
              <DataTable<Degree>
                columns={[
                  {
                    key: 'code',
                    header: 'Code',
                    render: (d) => <Badge variant="default">{d.code}</Badge>,
                    width: '80px',
                  },
                  {
                    key: 'name',
                    header: 'Program Name',
                    render: (d) => <span className="text-[13px] font-medium text-gray-900 dark:text-white">{d.name}</span>,
                  },
                  {
                    key: 'description',
                    header: 'Description',
                    render: (d) => d.description ? <span className="text-[12px] text-gray-600 dark:text-gray-400 line-clamp-2">{d.description}</span> : <span className="text-gray-400">—</span>,
                  },
                  {
                    key: 'actions',
                    header: '',
                    render: (d) => (
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" icon={<Pencil size={14} />} onClick={() => setEditDegree(d)} />
                        <Button variant="ghost" size="sm" icon={<Trash2 size={14} />} className="text-red-500 hover:text-red-600 hover:bg-red-500/10" onClick={() => setConfirmDelete(d)} />
                      </div>
                    ),
                    width: '80px',
                  },
                ]}
                data={majors}
                emptyMessage="No major degrees found"
                rowKey={(d) => d.id}
              />
            )}
          </div>

          {/* Minor Degrees */}
          <div className="space-y-3">
            <h2 className="text-[15px] font-semibold text-gray-900 dark:text-white">Minor Degrees</h2>
            {minors.length === 0 ? (
              <GlassCard className="text-center py-8 text-sm text-gray-400 dark:text-gray-600">No minor degrees created yet</GlassCard>
            ) : (
              <DataTable<Degree>
                columns={[
                  {
                    key: 'code',
                    header: 'Code',
                    render: (d) => <Badge variant="neutral">{d.code}</Badge>,
                    width: '80px',
                  },
                  {
                    key: 'name',
                    header: 'Program Name',
                    render: (d) => <span className="text-[13px] font-medium text-gray-900 dark:text-white">{d.name}</span>,
                  },
                  {
                    key: 'description',
                    header: 'Description',
                    render: (d) => d.description ? <span className="text-[12px] text-gray-600 dark:text-gray-400 line-clamp-2">{d.description}</span> : <span className="text-gray-400">—</span>,
                  },
                  {
                    key: 'actions',
                    header: '',
                    render: (d) => (
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" icon={<Pencil size={14} />} onClick={() => setEditDegree(d)} />
                        <Button variant="ghost" size="sm" icon={<Trash2 size={14} />} className="text-red-500 hover:text-red-600 hover:bg-red-500/10" onClick={() => setConfirmDelete(d)} />
                      </div>
                    ),
                    width: '80px',
                  },
                ]}
                data={minors}
                emptyMessage="No minor degrees found"
                rowKey={(d) => d.id}
              />
            )}
          </div>
        </>
      )}

      {/* Modals */}
      <DegreeModal open={showCreate} onClose={() => setShowCreate(false)} />
      <DegreeModal open={!!editDegree} onClose={() => setEditDegree(null)} degree={editDegree ?? undefined} />
      <Modal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Delete Degree"
        description={`"${confirmDelete?.name}" will be permanently deleted.`}
        size="sm"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setConfirmDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              loading={deleteMutation.isPending}
              onClick={() => confirmDelete && deleteMutation.mutate(confirmDelete.id)}
            >
              Delete
            </Button>
          </>
        }
      >
        <div />
      </Modal>
    </div>
  );
}

function DegreeModal({ open, onClose, degree }: { open: boolean; onClose: () => void; degree?: Degree }) {
  const qc = useQueryClient();
  const isEdit = !!degree;
  const [form, setForm] = useState({
    code: degree?.code ?? '',
    name: degree?.name ?? '',
    description: degree?.description ?? '',
    isMajor: degree?.isMajor ?? true,
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (p: Record<string, unknown>) => (isEdit ? degreesApi.update(degree!.id, p) : degreesApi.create(p)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['degrees'] });
      toast.success(isEdit ? 'Degree updated' : 'Degree created');
      onClose();
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const set = (k: string, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Degree' : 'New Degree'}
      size="md"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            loading={isPending}
            onClick={() => mutate(form)}
          >
            {isEdit ? 'Save Changes' : 'Create Degree'}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Degree Code"
            placeholder="CSE"
            maxLength={10}
            value={form.code}
            onChange={(e) => set('code', e.target.value.toUpperCase())}
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-gray-700 dark:text-gray-300">Type</label>
            <select
              value={form.isMajor ? 'MAJOR' : 'MINOR'}
              onChange={(e) => set('isMajor', e.target.value === 'MAJOR')}
              className="w-full h-11 px-4 text-sm rounded-xl bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.08] dark:border-white/[0.10] text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-[#0071E3]/15"
            >
              <option value="MAJOR">Major</option>
              <option value="MINOR">Minor</option>
            </select>
          </div>
        </div>
        <Input
          label="Program Name"
          placeholder="Computer Science & Engineering"
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
        />
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-medium text-gray-700 dark:text-gray-300">Description (Optional)</label>
          <textarea
            rows={3}
            placeholder="Brief description of the program..."
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            className="w-full px-4 py-3 text-sm rounded-xl bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.08] dark:border-white/[0.10] text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-600 outline-none focus:ring-2 focus:ring-[#0071E3]/15 dark:focus:ring-[#0A84FF]/15 resize-none"
          />
        </div>
      </div>
    </Modal>
  );
}
