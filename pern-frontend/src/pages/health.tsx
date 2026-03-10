import { useQuery } from '@tanstack/react-query';
import { healthApi } from '@/lib/api';
import { PageHeader } from '@/components/layout/page-header';
import { GlassCard } from '@/components/ui/glass-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';

export default function HealthPage() {
  const { isAdmin } = useAuthStore();

  const { data, isLoading, isError, isFetching, refetch, dataUpdatedAt } = useQuery({
    queryKey: ['health'],
    queryFn: healthApi.check,
    refetchInterval: 30_000,
  });

  const isOk = !isError && data?.status === 'OK';
  const dbUp = data?.services?.database ?? isOk;
  const apiUp = !isError && !!data;

  if (!isAdmin()) {
    return <div className="py-20 text-center text-gray-500 dark:text-gray-500">Access restricted to administrators.</div>;
  }

  return (
    <div className="animate-fade-in max-w-2xl space-y-6">
      <PageHeader
        title="System Health"
        description="Live API and infrastructure status"
        action={
          <Button
            variant="secondary"
            size="sm"
            icon={<RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />}
            onClick={() => refetch()}
            loading={isFetching && !data}
          >
            Refresh
          </Button>
        }
      />

      {/* Main status */}
      <GlassCard>
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${isOk ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
            {isLoading ? (
              <div className="w-6 h-6 rounded-full border-2 border-gray-300 border-t-[#0071E3] dark:border-white/10 dark:border-t-[#0A84FF] animate-spin" />
            ) : isOk ? (
              <CheckCircle size={28} className="text-emerald-600 dark:text-emerald-400" />
            ) : (
              <XCircle size={28} className="text-red-600 dark:text-red-400" />
            )}
          </div>
          <div>
            <p className="text-[18px] font-bold text-gray-900 dark:text-white">
              {isLoading ? 'Checking…' : isOk ? 'All Systems Operational' : data?.status === 'DEGRADED' ? 'Service Degraded' : 'Service Unavailable'}
            </p>
            <p className="text-[13px] text-gray-500 dark:text-gray-500 mt-0.5">
              Last checked: {dataUpdatedAt ? formatDate(new Date(dataUpdatedAt), 'HH:mm:ss') : '—'}
              {data?.timestamp && <span className="ml-2 font-mono opacity-60">· server: {formatDate(data.timestamp, 'HH:mm:ss')}</span>}
            </p>
          </div>
          <div className="ml-auto">
            {!isLoading && (
              <Badge variant={isOk ? 'success' : 'danger'} dot>
                {isOk ? 'Healthy' : 'Unhealthy'}
              </Badge>
            )}
          </div>
        </div>
      </GlassCard>

      {/* Service breakdown */}
      <GlassCard>
        <h3 className="text-[15px] font-semibold text-gray-900 dark:text-white mb-4">Services</h3>
        <ul className="space-y-3">
          {[
            { name: 'API Server', description: 'Express · port 8080', status: apiUp },
            { name: 'Database', description: 'PostgreSQL 16', status: dbUp },
            { name: 'Object Storage', description: 'MinIO (S3-compatible) · port 9000', status: isOk },
          ].map((svc) => (
            <li key={svc.name} className="flex items-center gap-3 py-2 border-b border-black/[0.04] dark:border-white/[0.05] last:border-0">
              <div className={`w-2 h-2 rounded-full shrink-0 ${isLoading ? 'bg-gray-300 animate-pulse-soft' : svc.status ? 'bg-emerald-500' : 'bg-red-500'}`} />
              <div className="flex-1">
                <p className="text-[13px] font-medium text-gray-900 dark:text-white">{svc.name}</p>
                <p className="text-[11px] text-gray-500 dark:text-gray-500">{svc.description}</p>
              </div>
              {!isLoading && (
                <Badge variant={svc.status ? 'success' : 'danger'} size="sm">
                  {svc.status ? 'Up' : 'Down'}
                </Badge>
              )}
              {isLoading && <div className="h-5 w-12 rounded-full bg-gray-200 dark:bg-white/[0.06] animate-pulse" />}
            </li>
          ))}
        </ul>
        <p className="mt-4 text-[11px] text-gray-400 dark:text-gray-600 italic">
          Service status is inferred from the API health endpoint. Individual service checks require Prometheus/Grafana.
        </p>
      </GlassCard>

      {/* Environment */}
      <GlassCard>
        <h3 className="text-[15px] font-semibold text-gray-900 dark:text-white mb-4">Environment</h3>
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'API Base URL', value: import.meta.env.VITE_API_URL || 'http://localhost:8080' },
            { label: 'Auto-refresh', value: 'Every 30 seconds' },
          ].map((r) => (
            <div key={r.label}>
              <p className="text-[11px] font-medium text-gray-500 dark:text-gray-500 uppercase tracking-wide">{r.label}</p>
              <p className="text-[13px] text-gray-900 dark:text-white mt-0.5 font-mono">{r.value}</p>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
