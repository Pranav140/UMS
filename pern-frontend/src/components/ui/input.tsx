import { InputHTMLAttributes, forwardRef, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: ReactNode;
  iconRight?: ReactNode;
  inputSize?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
  sm: 'h-9 text-[13px] rounded-[10px] px-3',
  md: 'h-11 text-sm rounded-xl px-4',
  lg: 'h-12 text-[15px] rounded-xl px-4',
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      error,
      hint,
      icon,
      iconRight,
      inputSize = 'md',
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label className="text-[13px] font-medium text-gray-700 dark:text-gray-300 select-none">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {icon && (
            <span className="absolute left-3.5 text-gray-400 dark:text-gray-500 pointer-events-none z-10">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            disabled={disabled}
            className={cn(
              'w-full bg-black/[0.04] dark:bg-white/[0.06]',
              'border border-black/[0.08] dark:border-white/[0.10]',
              'text-gray-900 dark:text-gray-100',
              'placeholder:text-gray-400 dark:placeholder:text-gray-600',
              'backdrop-blur-sm',
              'outline-none transition-all duration-150',
              'focus:bg-white dark:focus:bg-white/[0.08]',
              'focus:border-[#0071E3]/60 dark:focus:border-[#0A84FF]/60',
              'focus:ring-2 focus:ring-[#0071E3]/15 dark:focus:ring-[#0A84FF]/15',
              error && 'border-red-400 dark:border-red-500 focus:ring-red-400/15',
              'disabled:opacity-40 disabled:cursor-not-allowed',
              sizeMap[inputSize],
              icon && 'pl-10',
              iconRight && 'pr-10',
              className
            )}
            {...props}
          />
          {iconRight && (
            <span className="absolute right-3.5 text-gray-400 dark:text-gray-500 pointer-events-none z-10">
              {iconRight}
            </span>
          )}
        </div>
        {error && (
          <p className="text-[12px] text-red-500 dark:text-red-400 leading-tight">{error}</p>
        )}
        {hint && !error && (
          <p className="text-[12px] text-gray-500 dark:text-gray-500 leading-tight">{hint}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
