import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { GlassCard } from '@/components/ui/glass-card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  iconColor?: string;
  trend?: 'up' | 'down' | 'flat';
  trendLabel?: string;
  loading?: boolean;
}

export function StatCard({ title, value, subtitle, icon, iconColor, trend, trendLabel, loading }: StatCardProps) {
  return (
    <GlassCard className="flex items-start gap-4">
      <div className={cn(
        'w-11 h-11 rounded-2xl flex items-center justify-center shrink-0',
        iconColor ?? 'bg-[#0071E3]/10 dark:bg-[#0A84FF]/10 text-[#0071E3] dark:text-[#0A84FF]'
      )}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-medium text-gray-500 dark:text-gray-500 uppercase tracking-wide truncate">{title}</p>
        {loading ? (
          <div className="mt-1.5 h-7 w-16 rounded-lg bg-gray-200 dark:bg-white/[0.06] animate-pulse" />
        ) : (
          <p className="mt-0.5 text-[26px] font-bold text-gray-900 dark:text-white leading-none tracking-tight">
            {value}
          </p>
        )}
        {(subtitle || trend) && (
          <div className="flex items-center gap-1.5 mt-1.5">
            {trend && (
              <span className={cn(
                'flex items-center gap-0.5 text-[11px] font-medium',
                trend === 'up' && 'text-emerald-600 dark:text-emerald-400',
                trend === 'down' && 'text-red-500 dark:text-red-400',
                trend === 'flat' && 'text-gray-400',
              )}>
                {trend === 'up' && <TrendingUp size={11} />}
                {trend === 'down' && <TrendingDown size={11} />}
                {trend === 'flat' && <Minus size={11} />}
                {trendLabel}
              </span>
            )}
            {subtitle && !trend && (
              <p className="text-[12px] text-gray-500 dark:text-gray-500">{subtitle}</p>
            )}
          </div>
        )}
      </div>
    </GlassCard>
  );
}
