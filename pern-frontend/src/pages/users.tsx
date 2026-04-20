import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';
import { usersApi, degreesApi } from '@/lib/api';
import { PageHeader } from '@/components/layout/page-header';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { DataTable } from '@/components/ui/table';
import { Select } from '@/components/ui/select';
import { getInitials, getErrorMessage, ROLE_COLORS, ROLE_LABELS, formatDateShort } from '@/lib/utils';
import { UserPlus, Search, Trash2, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import type { User, Role, Degree } from '@/types';

export default function UsersPage() {
  const { isAdmin } = useAuthStore();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [showProvision, setShowProvision] = useState(false);
  const [viewUser, setViewUser] = useState<User | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<User | null>(null);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users', roleFilter],
    queryFn: () => usersApi.list({ role: roleFilter || undefined }),
  });

  const filtered = users.filter((u: User) =>
    !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  );

  const deleteMutation = useMutation({
    mutationFn: (id: string) => usersApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      toast.success('User deleted');
      setConfirmDelete(null);
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  if (!isAdmin()) {
    return <div className="py-20 text-center text-gray-500 dark:text-gray-500">Access restricted to administrators.</div>;
  }

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Users"
        description="Manage institutional user accounts"
        action={<Button icon={<UserPlus size={16} />} onClick={() => setShowProvision(true)}>Provision User</Button>}
      />

      {/* Filters */}
      <GlassCard padding="sm">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Search by name or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<Search size={15} />}
              inputSize="sm"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="h-9 px-3 text-[13px] rounded-[10px] bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.08] dark:border-white/[0.10] text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-[#0071E3]/15 dark:focus:ring-[#0A84FF]/15"
          >
            <option value="">All Roles</option>
            <option value="STUDENT">Student</option>
            <option value="FACULTY">Faculty</option>
            <option value="ADMIN">Admin</option>
            <option value="DEVELOPER">Developer</option>
          </select>
        </div>
      </GlassCard>

      {/* Table */}
      <DataTable<User>
        columns={[
          {
            key: 'name',
            header: 'Name',
            render: (u) => (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#0071E3] to-[#6366F1] flex items-center justify-center text-[11px] font-bold text-white shrink-0">
                  {getInitials(u.name)}
                </div>
                <div>
                  <p className="text-[13px] font-medium text-gray-900 dark:text-white">{u.name}</p>
                  <p className="text-[11px] text-gray-500 dark:text-gray-500">{u.email}</p>
                </div>
              </div>
            ),
          },
          {
            key: 'role',
            header: 'Role',
            render: (u) => (
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium ${ROLE_COLORS[u.role]}`}>{ROLE_LABELS[u.role]}</span>
            ),
            width: '120px',
          },
          {
            key: 'createdAt',
            header: 'Joined',
            render: (u) => <span className="text-[12px] text-gray-500">{formatDateShort(u.createdAt)}</span>,
            width: '120px',
          },
          {
            key: 'actions',
            header: '',
            render: (u) => (
              <div className="flex items-center gap-1 justify-end">
                <Button variant="ghost" size="sm" icon={<Eye size={14} />} onClick={() => setViewUser(u)} />
                <Button variant="ghost" size="sm" icon={<Trash2 size={14} />} className="text-red-500 hover:text-red-600 hover:bg-red-500/10" onClick={() => setConfirmDelete(u)} />
              </div>
            ),
            width: '90px',
          },
        ]}
        data={filtered}
        loading={isLoading}
        emptyMessage="No users found"
        rowKey={(u) => u.id}
      />

      {/* Provision Modal */}
      <ProvisionModal open={showProvision} onClose={() => setShowProvision(false)} />

      {/* View User Modal */}
      <Modal open={!!viewUser} onClose={() => setViewUser(null)} title="User Details" size="sm">
        {viewUser && (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0071E3] to-[#6366F1] flex items-center justify-center text-lg font-bold text-white">
                {getInitials(viewUser.name)}
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">{viewUser.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{viewUser.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <InfoRow label="Role" value={ROLE_LABELS[viewUser.role]} />
              <InfoRow label="Joined" value={formatDateShort(viewUser.createdAt)} />
              <InfoRow label="ID" value={viewUser.id.slice(0, 8) + '…'} />
            </div>
          </div>
        )}
      </Modal>

      {/* Delete confirm */}
      <Modal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Delete User"
        description={`This will permanently delete "${confirmDelete?.name}". This action cannot be undone.`}
        size="sm"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setConfirmDelete(null)}>Cancel</Button>
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

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] text-gray-500 dark:text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="text-[13px] font-medium text-gray-900 dark:text-white mt-0.5">{value}</p>
    </div>
  );
}

// ─── Provision Modal ──────────────────────────────────────────────────────────
function ProvisionModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: '' , email: '', role: 'STUDENT' as Role, initialPassword: '',
    enrollmentYear: '', degreeId: '', department: '', title: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch degrees - only show major degrees for students
  const { data: degrees = [] } = useQuery({
    queryKey: ['degrees', 'major'],
    queryFn: () => degreesApi.list({ isMajor: true }),
    enabled: form.role === 'STUDENT',
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (payload: Record<string, unknown>) => usersApi.provision(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      toast.success('User provisioned successfully');
      onClose();
      setForm({ name: '', email: '', role: 'STUDENT', initialPassword: '', enrollmentYear: '', degreeId: '', department: '', title: '' });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    if (!form.email.endsWith('@iiitu.ac.in')) e.email = 'Must be an @iiitu.ac.in email';
    if (!form.initialPassword || form.initialPassword.length < 8) e.initialPassword = 'Min 8 characters';
    if (form.role === 'STUDENT' && !form.degreeId) e.degreeId = 'Degree is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    
    const selectedDegree = form.degreeId ? (degrees as Degree[]).find((d) => d.id === form.degreeId) : null;
    const profileData: Record<string, unknown> = {};
    
    if (form.role === 'STUDENT') {
      profileData.enrollmentYear = Number(form.enrollmentYear) || new Date().getFullYear();
      profileData.degreeId = form.degreeId;
      profileData.major = selectedDegree?.code || 'Undeclared'; // Use degree code as major
    }
    if (form.role === 'FACULTY') {
      profileData.department = form.department || 'General';
      profileData.title = form.title || 'Lecturer';
    }
    
    mutate({ name: form.name, email: form.email, role: form.role, initialPassword: form.initialPassword, profileData });
  };

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <Modal open={open} onClose={onClose} title="Provision New User" description="Create a new institutional account" size="md"
      footer={<><Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button><Button size="sm" loading={isPending} onClick={handleSubmit}>Create User</Button></>}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Input label="Full Name" placeholder="Jane Smith" value={form.name} onChange={(e) => set('name', e.target.value)} error={errors.name} />
          <Input label="Email" placeholder="jane@iiitu.ac.in" value={form.email} onChange={(e) => set('email', e.target.value)} error={errors.email} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Select label="Role" value={form.role} onChange={(e) => set('role', e.target.value as Role)}>
            <option value="STUDENT">Student</option>
            <option value="FACULTY">Faculty</option>
            <option value="ADMIN">Admin</option>
            <option value="DEVELOPER">Developer</option>
          </Select>
          <Input label="Initial Password" type="password" placeholder="Min 8 chars" value={form.initialPassword} onChange={(e) => set('initialPassword', e.target.value)} error={errors.initialPassword} />
        </div>

        {/* Student-specific fields */}
        {form.role === 'STUDENT' && (
          <div className="grid grid-cols-2 gap-3">
            <Input label="Enrollment Year" placeholder="2024" type="number" value={form.enrollmentYear} onChange={(e) => set('enrollmentYear', e.target.value)} />
            <Select label="Degree/Branch" value={form.degreeId} onChange={(e) => set('degreeId', e.target.value)} error={errors.degreeId}>
              <option value="">Select a degree...</option>
              {(degrees as Degree[]).map((d) => (
                <option key={d.id} value={d.id}>
                  {d.code} - {d.name}
                </option>
              ))}
            </Select>
          </div>
        )}

        {/* Faculty-specific fields */}
        {form.role === 'FACULTY' && (
          <div className="grid grid-cols-2 gap-3">
            <Input label="Department" placeholder="CSE" value={form.department} onChange={(e) => set('department', e.target.value)} />
            <Input label="Title" placeholder="Associate Professor" value={form.title} onChange={(e) => set('title', e.target.value)} />
          </div>
        )}
      </div>
    </Modal>
  );
}
