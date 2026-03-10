import { cn } from '@/lib/utils';
import { HTMLAttributes, forwardRef } from 'react';

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  border?: boolean;
}

const paddingMap = {
  none: '',
  sm: 'p-4',
  md: 'p-5 sm:p-6',
  lg: 'p-6 sm:p-8',
};

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, hover = false, padding = 'md', border = true, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-2xl backdrop-blur-xl transition-all duration-200',
          'bg-white/80 shadow-glass',
          'dark:bg-white/[0.04] dark:shadow-glass-dark',
          border && 'border border-black/[0.06] dark:border-white/[0.08]',
          hover && [
            'cursor-pointer',
            'hover:-translate-y-0.5 hover:shadow-glass-hover',
            'dark:hover:shadow-glass-hover-dark dark:hover:bg-white/[0.06]',
          ],
          paddingMap[padding],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

GlassCard.displayName = 'GlassCard';
