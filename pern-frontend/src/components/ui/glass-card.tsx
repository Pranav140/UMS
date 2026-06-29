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
  md: 'p-6 sm:p-7',
  lg: 'p-7 sm:p-9',
};

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, hover = false, padding = 'md', border = true, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-[28px] transition-all duration-300 ease-out',
          'bg-white shadow-[0_8px_30px_rgb(0,0,0,0.025)]',
          'dark:bg-[#121214] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)]',
          border && 'border border-black/[0.03] dark:border-white/[0.05]',
          hover && [
            'cursor-pointer',
            'hover:-translate-y-1 hover:shadow-[0_12px_40px_rgb(0,0,0,0.05)]',
            'dark:hover:shadow-[0_12px_40px_rgba(0,0,0,0.6)] dark:hover:bg-[#161619]',
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
