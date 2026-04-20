import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { coursesApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { PageHeader } from '@/components/layout/page-header';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { getErrorMessage } from '@/lib/utils';
import { Plus, Search, Pencil, Trash2, BookOpen, Award } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Course, CourseType, CourseCategory } from '@/types';

export default function CoursesPage() {
  const { isAdmin } = useAuthStore();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editCourse, setEditCourse] = useState<Course | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Course | null>(null);

  const { data: courses = [], isLoading } = useQuery({
    queryKey: ['courses'],
    queryFn: coursesApi.list,
  });

  const filtered = courses.filter((c: Course) =>
    !search || c.title.toLowerCase().includes(search.toLowerCase()) || c.code.toLowerCase().includes(search.toLowerCase())
  );

  const deleteMutation = useMutation({
    mutationFn: (id: string) => coursesApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['courses'] }); toast.success('Course deleted'); setConfirmDelete(null); },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Courses"
        description={isAdmin() ? "Manage the course catalog" : "Browse available courses"}
        action={isAdmin() && <Button icon={<Plus size={16} />} onClick={() => setShowCreate(true)}>New Course</Button>}
      />

      {/* Search */}
      <GlassCard padding="sm">
        <Input placeholder="Search courses…" value={search} onChange={(e) => setSearch(e.target.value)} icon={<Search size={15} />} inputSize="sm" />
      </GlassCard>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl bg-white/80 dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.08] p-5 h-36 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <GlassCard className="text-center py-12 text-gray-400 dark:text-gray-600 text-sm">
          {search ? 'No courses match your search.' : 'No courses created yet.'}
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c: Course) => (
            <GlassCard key={c.id} hover className="group">
              <div className="flex items-start justify-between gap-2">
                <div className="w-10 h-10 rounded-xl bg-[#0071E3]/10 dark:bg-[#0A84FF]/10 flex items-center justify-center shrink-0">
                  <BookOpen size={18} className="text-[#0071E3] dark:text-[#0A84FF]" />
                </div>
                {isAdmin() && (
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setEditCourse(c)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-black/[0.06] dark:hover:bg-white/[0.08] transition-all">
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => setConfirmDelete(c)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-500/10 transition-all">
                      <Trash2 size={13} />
                    </button>
                  </div>
                )}
              </div>
              <div className="mt-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11px] font-mono font-semibold text-gray-500 dark:text-gray-500">{c.code}</span>
                </div>
                <h3 className="text-[14px] font-semibold text-gray-900 dark:text-white leading-snug line-clamp-2">{c.title}</h3>
                {c.description && (
                  <p className="text-[12px] text-gray-500 dark:text-gray-500 mt-1.5 line-clamp-2 leading-relaxed">{c.description}</p>
                )}
              </div>
              <div className="flex items-center gap-2 mt-3">
                <Badge variant="neutral"><Award size={10} className="mr-1" />{c.credits} credits</Badge>
                <Badge variant={c.type === 'THEORY' ? 'default' : 'neutral'}>{c.type === 'THEORY' ? 'Theory' : 'Theory + Lab'}</Badge>
                <Badge variant={c.category === 'MAJOR' ? 'default' : 'neutral'}>{c.category}</Badge>
                {c.sections && c.sections.length > 0 && (
                  <Badge variant="default">{c.sections.length} section{c.sections.length !== 1 ? 's' : ''}</Badge>
                )}
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* Modals */}
      <CourseModal open={showCreate} onClose={() => setShowCreate(false)} />
      <CourseModal open={!!editCourse} onClose={() => setEditCourse(null)} course={editCourse ?? undefined} />
      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Delete Course" description={`"${confirmDelete?.title}" will be permanently deleted.`} size="sm"
        footer={<><Button variant="secondary" size="sm" onClick={() => setConfirmDelete(null)}>Cancel</Button><Button variant="danger" size="sm" loading={deleteMutation.isPending} onClick={() => confirmDelete && deleteMutation.mutate(confirmDelete.id)}>Delete</Button></>}>
        <div />
      </Modal>
    </div>
  );
}

function CourseModal({ open, onClose, course }: { open: boolean; onClose: () => void; course?: Course }) {
  const qc = useQueryClient();
  const isEdit = !!course;
  const [form, setForm] = useState({
    code: course?.code ?? '',
    title: course?.title ?? '',
    description: course?.description ?? '',
    credits: String(course?.credits ?? 3),
    type: (course?.type ?? 'THEORY') as CourseType,
    category: (course?.category ?? 'MAJOR') as CourseCategory,
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (p: Record<string, unknown>) => isEdit ? coursesApi.update(course!.id, p) : coursesApi.create(p),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['courses'] }); toast.success(isEdit ? 'Course updated' : 'Course created'); onClose(); },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Course' : 'New Course'} size="md"
      footer={<><Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button><Button size="sm" loading={isPending} onClick={() => mutate({ ...form, credits: Number(form.credits) })}>{isEdit ? 'Save Changes' : 'Create Course'}</Button></>}>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Input label="Course Code" placeholder="CS301" value={form.code} onChange={(e) => set('code', e.target.value)} />
          <Input label="Credits" type="number" min="1" max="6" placeholder="3" value={form.credits} onChange={(e) => set('credits', e.target.value)} />
        </div>
        <Input label="Title" placeholder="Operating Systems" value={form.title} onChange={(e) => set('title', e.target.value)} />
        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Course Type"
            value={form.type}
            onChange={(e) => set('type', e.target.value)}
          >
            <option value="THEORY">Theory Only</option>
            <option value="THEORY_LAB">Theory + Lab</option>
          </Select>
          <Select
            label="Category"
            value={form.category}
            onChange={(e) => set('category', e.target.value)}
          >
            <option value="MAJOR">Major</option>
            <option value="MINOR">Minor</option>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-medium text-gray-700 dark:text-gray-300">Description</label>
          <textarea
            rows={3}
            placeholder="Brief course description…"
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            className="w-full px-4 py-3 text-sm rounded-xl bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.08] dark:border-white/[0.10] text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-600 outline-none focus:ring-2 focus:ring-[#0071E3]/15 dark:focus:ring-[#0A84FF]/15 resize-none"
          />
        </div>
      </div>
    </Modal>
  );
}
