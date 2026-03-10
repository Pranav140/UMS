import { useQuery } from '@tanstack/react-query';
import { enrollmentApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { PageHeader } from '@/components/layout/page-header';
import { GlassCard } from '@/components/ui/glass-card';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useState } from 'react';
import { formatDateShort } from '@/lib/utils';
import type { Enrollment } from '@/types';

export default function EnrollmentsPage() {
  const { isAdmin } = useAuthStore();
  const [search, setSearch] = useState('');

  const { data: enrollments = [], isLoading } = useQuery({
    queryKey: ['all-enrollments'],
    queryFn: () => enrollmentApi.all(),
    enabled: isAdmin(),
  });

  const filtered = (enrollments as Enrollment[]).filter(
    (e) => !search ||
      e.student?.name?.toLowerCase().includes(search.toLowerCase()) ||
      e.section?.course?.title?.toLowerCase().includes(search.toLowerCase()) ||
      e.section?.course?.code?.toLowerCase().includes(search.toLowerCase())
  );

  if (!isAdmin()) {
    return <div className="py-20 text-center text-gray-500 dark:text-gray-500">Access restricted to administrators.</div>;
  }

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Enrollments" description="All student course enrollments" />

      <GlassCard padding="sm">
        <Input placeholder="Search by student or course…" value={search} onChange={(e) => setSearch(e.target.value)} icon={<Search size={15} />} inputSize="sm" />
      </GlassCard>

      <DataTable<Enrollment>
        columns={[
          {
            key: 'student',
            header: 'Student',
            render: (e) => (
              <div>
                <p className="text-[13px] font-medium text-gray-900 dark:text-white">{e.student?.name ?? '—'}</p>
                <p className="text-[11px] text-gray-500 dark:text-gray-500">{e.student?.email ?? ''}</p>
              </div>
            ),
          },
          {
            key: 'course',
            header: 'Course',
            render: (e) => (
              <div>
                <p className="text-[13px] font-medium text-gray-900 dark:text-white">{e.section?.course?.title ?? '—'}</p>
                <p className="text-[11px] text-gray-500 dark:text-gray-500 font-mono">{e.section?.course?.code}</p>
              </div>
            ),
          },
          {
            key: 'faculty',
            header: 'Faculty',
            render: (e) => <span className="text-[13px] text-gray-700 dark:text-gray-300">{e.section?.faculty?.user?.name ?? <span className="text-gray-400">Unassigned</span>}</span>,
          },
          {
            key: 'status',
            header: 'Status',
            render: (e) => (
              <Badge variant={e.status === 'ENROLLED' ? 'success' : 'neutral'} dot>
                {e.status}
              </Badge>
            ),
            width: '110px',
          },
          {
            key: 'createdAt',
            header: 'Date',
            render: (e) => <span className="text-[12px] text-gray-500">{formatDateShort(e.createdAt)}</span>,
            width: '110px',
          },
        ]}
        data={filtered}
        loading={isLoading}
        emptyMessage="No enrollments found."
        rowKey={(e) => e.id}
      />
    </div>
  );
}
