import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';
import { usersApi } from '@/lib/api';
import { PageHeader } from '@/components/layout/page-header';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { getInitials, getErrorMessage, ROLE_LABELS, ROLE_COLORS, formatDateShort } from '@/lib/utils';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { KeyRound, User } from 'lucide-react';

export default function ProfilePage() {
  const { user, clearAuth } = useAuthStore();
  const [showChangePassword, setShowChangePassword] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: usersApi.me,
  });

  return (
    <div className="animate-fade-in max-w-2xl space-y-6">
      <PageHeader
        title="Profile"
        description="Your account information and settings"
      />

      {/* Account card */}
      <GlassCard>
        {isLoading ? (
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gray-200 dark:bg-white/[0.06] animate-pulse" />
            <div className="space-y-2 flex-1">
              <div className="h-4 w-40 rounded-lg bg-gray-200 dark:bg-white/[0.06] animate-pulse" />
              <div className="h-3 w-56 rounded-lg bg-gray-200 dark:bg-white/[0.04] animate-pulse" />
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0071E3] to-[#6366F1] flex items-center justify-center text-xl font-bold text-white shrink-0 shadow-lg shadow-[#0071E3]/20">
              {profile ? getInitials(profile.name) : <User size={24} />}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-[18px] font-bold text-gray-900 dark:text-white">{profile?.name}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{profile?.email}</p>
              <div className="flex items-center gap-2 mt-2">
                {profile?.role && (
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium ${ROLE_COLORS[profile.role]}`}>
                    {ROLE_LABELS[profile.role]}
                  </span>
                )}
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              icon={<KeyRound size={14} />}
              onClick={() => setShowChangePassword(true)}
            >
              Change Password
            </Button>
          </div>
        )}
      </GlassCard>

      {/* Profile details */}
      <GlassCard>
        <h3 className="text-[15px] font-semibold text-gray-900 dark:text-white mb-4">Account Details</h3>
        <div className="grid grid-cols-2 gap-4">
          <DetailRow label="User ID" value={profile?.id?.slice(0, 8) + '…'} />
          <DetailRow label="Email" value={profile?.email} />
          <DetailRow label="Role" value={profile?.role ? ROLE_LABELS[profile.role] : '—'} />
          <DetailRow label="Member Since" value={profile?.createdAt ? formatDateShort(profile.createdAt) : '—'} />
        </div>
      </GlassCard>

      {/* Role-specific profile */}
      {profile?.studentProfile && (
        <GlassCard>
          <h3 className="text-[15px] font-semibold text-gray-900 dark:text-white mb-4">Student Profile</h3>
          <div className="grid grid-cols-2 gap-4">
            <DetailRow label="Enrollment Year" value={String(profile.studentProfile.enrollmentYear)} />
            <DetailRow label="Major" value={profile.studentProfile.major} />
          </div>
        </GlassCard>
      )}

      {profile?.facultyProfile && (
        <GlassCard>
          <h3 className="text-[15px] font-semibold text-gray-900 dark:text-white mb-4">Faculty Profile</h3>
          <div className="grid grid-cols-2 gap-4">
            <DetailRow label="Department" value={profile.facultyProfile.department} />
            <DetailRow label="Title" value={profile.facultyProfile.title ?? undefined} />
          </div>
        </GlassCard>
      )}

      <ChangePasswordModal open={showChangePassword} onClose={() => setShowChangePassword(false)} />
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p className="text-[11px] font-medium text-gray-500 dark:text-gray-500 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-[14px] text-gray-900 dark:text-white">{value ?? '—'}</p>
    </div>
  );
}

function ChangePasswordModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { mutate, isPending } = useMutation({
    mutationFn: (p: { currentPassword: string; newPassword: string }) => usersApi.changePassword(p),
    onSuccess: () => {
      toast.success('Password changed successfully');
      onClose();
      setForm({ currentPassword: '', newPassword: '', confirm: '' });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.currentPassword) e.currentPassword = 'Required';
    if (form.newPassword.length < 8) e.newPassword = 'Min 8 characters';
    if (form.newPassword !== form.confirm) e.confirm = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  return (
    <Modal open={open} onClose={onClose} title="Change Password" size="sm"
      footer={<><Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button><Button size="sm" loading={isPending} onClick={() => { if (validate()) mutate({ currentPassword: form.currentPassword, newPassword: form.newPassword }); }}>Update Password</Button></>}>
      <div className="space-y-3">
        <Input label="Current Password" type="password" value={form.currentPassword} onChange={(e) => setForm((f) => ({ ...f, currentPassword: e.target.value }))} error={errors.currentPassword} />
        <Input label="New Password" type="password" value={form.newPassword} onChange={(e) => setForm((f) => ({ ...f, newPassword: e.target.value }))} error={errors.newPassword} />
        <Input label="Confirm New Password" type="password" value={form.confirm} onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.value }))} error={errors.confirm} />
      </div>
    </Modal>
  );
}
