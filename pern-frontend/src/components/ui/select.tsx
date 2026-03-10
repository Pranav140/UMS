import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface SelectProps extends HTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  value?: string;
  onChange?: React.ChangeEventHandler<HTMLSelectElement>;
  disabled?: boolean;
  name?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, children, disabled, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label className="text-[13px] font-medium text-gray-700 dark:text-gray-300 select-none">
            {label}
          </label>
        )}
        <select
          ref={ref}
          disabled={disabled}
          className={cn(
            'w-full h-11 px-4 text-sm rounded-xl',
            'bg-black/[0.04] dark:bg-white/[0.06]',
            'border border-black/[0.08] dark:border-white/[0.10]',
            'text-gray-900 dark:text-gray-100',
            'backdrop-blur-sm',
            'outline-none transition-all duration-150',
            'focus:bg-white dark:focus:bg-white/[0.08]',
            'focus:border-[#0071E3]/60 dark:focus:border-[#0A84FF]/60',
            'focus:ring-2 focus:ring-[#0071E3]/15 dark:focus:ring-[#0A84FF]/15',
            error && 'border-red-400 dark:border-red-500',
            'disabled:opacity-40 disabled:cursor-not-allowed',
            'appearance-none cursor-pointer',
            className
          )}
          {...props}
        >
          {children}
        </select>
        {error && (
          <p className="text-[12px] text-red-500 dark:text-red-400 leading-tight">{error}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
