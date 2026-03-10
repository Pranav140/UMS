import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sectionsApi, coursesApi, semestersApi, usersApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { PageHeader } from '@/components/layout/page-header';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { DataTable } from '@/components/ui/table';
import { getErrorMessage } from '@/lib/utils';
import { Plus, Pencil, Trash2, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Section, Course, Semester, User } from '@/types';

export default function SectionsPage() {
  const { isAdmin } = useAuthStore();
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [editSection, setEditSection] = useState<Section | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Section | null>(null);

  const { data: courses_list = [] } = useQuery({ queryKey: ['courses'], queryFn: coursesApi.list });
  const { data: semesters_list = [] } = useQuery({ queryKey: ['semesters'], queryFn: semestersApi.list });
  const { data: faculty_list = [] } = useQuery({
    queryKey: ['users', 'FACULTY'],
    queryFn: () => usersApi.list({ role: 'FACULTY' }),
    enabled: isAdmin(),
  });

  // Collect all sections from all courses
  const allSections: Section[] = (courses_list as Course[]).flatMap((c) =>
    (c.sections ?? []).map((s) => ({ ...s, course: c }))
  );

  const deleteMutation = useMutation({
    mutationFn: (id: string) => sectionsApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['courses'] }); toast.success('Section deleted'); setConfirmDelete(null); },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  if (!isAdmin()) {
    return <div className="py-20 text-center text-gray-500 dark:text-gray-500">Access restricted to administrators.</div>;
  }

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Course Sections"
        description="Manage section assignments and capacity"
        action={<Button icon={<Plus size={16} />} onClick={() => setShowCreate(true)}>New Section</Button>}
      />

      <DataTable<Section>
        columns={[
          {
            key: 'course',
            header: 'Course',
            render: (s) => (
              <div>
                <p className="text-[13px] font-medium text-gray-900 dark:text-white">{s.course?.title ?? '—'}</p>
                <p className="text-[11px] text-gray-500 dark:text-gray-500 font-mono">{s.course?.code}</p>
              </div>
            ),
          },
          {
            key: 'faculty',
            header: 'Faculty',
            render: (s) => s.faculty ? (
              <span className="text-[13px] text-gray-800 dark:text-gray-200">{s.faculty.user?.name ?? 'Unknown'}</span>
            ) : (
              <Badge variant="warning">Unassigned</Badge>
            ),
          },
          {
            key: 'capacity',
            header: 'Capacity',
            render: (s) => (
              <div className="flex items-center gap-2">
                <Users size={13} className="text-gray-400" />
                <span className="text-[13px]">{s._count?.enrollments ?? 0} / {s.capacity}</span>
              </div>
            ),
            width: '120px',
          },
          {
            key: 'actions',
            header: '',
            render: (s) => (
              <div className="flex justify-end gap-1">
                <Button variant="ghost" size="sm" icon={<Pencil size={14} />} onClick={() => setEditSection(s)} />
                <Button variant="ghost" size="sm" icon={<Trash2 size={14} />} className="text-red-500 hover:text-red-600 hover:bg-red-500/10" onClick={() => setConfirmDelete(s)} />
              </div>
            ),
            width: '80px',
          },
        ]}
        data={allSections}
        emptyMessage="No sections found. Create a section to get started."
        rowKey={(s) => s.id}
      />

      <SectionModal
        open={showCreate || !!editSection}
        onClose={() => { setShowCreate(false); setEditSection(null); }}
        section={editSection ?? undefined}
        courses={courses_list}
        semesters={semesters_list}
        faculty={faculty_list}
      />

      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Delete Section"
        description={`Delete section for "${confirmDelete?.course?.title}"? This will also remove all enrollments.`} size="sm"
        footer={<><Button variant="secondary" size="sm" onClick={() => setConfirmDelete(null)}>Cancel</Button><Button variant="danger" size="sm" loading={deleteMutation.isPending} onClick={() => confirmDelete && deleteMutation.mutate(confirmDelete.id)}>Delete</Button></>}>
        <div />
      </Modal>
    </div>
  );
}

function SectionModal({ open, onClose, section, courses, semesters, faculty }: {
  open: boolean; onClose: () => void; section?: Section;
  courses: Course[]; semesters: Semester[]; faculty: User[];
}) {
  const qc = useQueryClient();
  const isEdit = !!section;
  const [form, setForm] = useState({
    courseId: section?.courseId ?? '',
    semesterId: section?.semesterId ?? '',
    capacity: String(section?.capacity ?? 60),
    facultyId: section?.facultyId ?? '',
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (p: Record<string, unknown>) => isEdit ? sectionsApi.update(section!.id, p) : sectionsApi.create(p),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['courses'] }); toast.success(isEdit ? 'Section updated' : 'Section created'); onClose(); },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit Section' : 'New Section'} size="md"
      footer={<><Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button><Button size="sm" loading={isPending} onClick={() => mutate({ ...form, capacity: Number(form.capacity), facultyId: form.facultyId || null })}>{isEdit ? 'Save' : 'Create'}</Button></>}>
      <div className="space-y-3">
        <Select label="Course" value={form.courseId} onChange={(e) => set('courseId', e.target.value)}>
          <option value="">Select course</option>
          {courses.map((c) => <option key={c.id} value={c.id}>{c.title} ({c.code})</option>)}
        </Select>
        <Select label="Semester" value={form.semesterId} onChange={(e) => set('semesterId', e.target.value)}>
          <option value="">Select semester</option>
          {semesters.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </Select>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Capacity" type="number" min="1" value={form.capacity} onChange={(e) => set('capacity', e.target.value)} />
          <Select label="Faculty (optional)" value={form.facultyId} onChange={(e) => set('facultyId', e.target.value)}>
            <option value="">Unassigned</option>
            {faculty.map((f) => <option key={f.id} value={f.facultyProfile?.id ?? ''}>{f.name}</option>)}
          </Select>
        </div>
      </div>
    </Modal>
  );
}
