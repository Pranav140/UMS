import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  fullWidth?: boolean;
}

const variants = {
  primary: [
    'bg-[#0071E3] text-white',
    'hover:bg-[#0077ED] active:bg-[#006AD6]',
    'dark:bg-[#0A84FF] dark:hover:bg-[#409CFF] dark:active:bg-[#0070D8]',
    'shadow-sm shadow-[#0071E3]/20 dark:shadow-[#0A84FF]/20',
  ].join(' '),

  secondary: [
    'bg-black/[0.06] text-gray-900',
    'hover:bg-black/[0.10] active:bg-black/[0.14]',
    'dark:bg-white/[0.08] dark:text-white',
    'dark:hover:bg-white/[0.12] dark:active:bg-white/[0.16]',
  ].join(' '),

  ghost: [
    'bg-transparent text-gray-700',
    'hover:bg-black/[0.05] active:bg-black/[0.08]',
    'dark:text-gray-300',
    'dark:hover:bg-white/[0.06] dark:active:bg-white/[0.10]',
  ].join(' '),

  danger: [
    'bg-red-500 text-white',
    'hover:bg-red-600 active:bg-red-700',
    'dark:bg-red-500/90 dark:hover:bg-red-500',
    'shadow-sm shadow-red-500/20',
  ].join(' '),

  outline: [
    'bg-transparent border border-black/[0.12] text-gray-800',
    'hover:bg-black/[0.04] active:bg-black/[0.08]',
    'dark:border-white/[0.14] dark:text-gray-200',
    'dark:hover:bg-white/[0.05] dark:active:bg-white/[0.08]',
  ].join(' '),
};

const sizes = {
  sm: 'h-8 px-3 text-[13px] rounded-[10px] gap-1.5',
  md: 'h-10 px-4 text-sm rounded-xl gap-2',
  lg: 'h-12 px-6 text-[15px] rounded-2xl gap-2.5',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      loading = false,
      icon,
      iconRight,
      fullWidth,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={cn(
          'inline-flex items-center justify-center font-medium',
          'transition-all duration-150 ease-out',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0071E3]/50 dark:focus-visible:ring-[#0A84FF]/50',
          'disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none',
          'select-none whitespace-nowrap',
          variants[variant],
          sizes[size],
          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {loading ? (
          <Loader2 className="animate-spin shrink-0" size={size === 'sm' ? 14 : 16} />
        ) : icon ? (
          <span className="shrink-0">{icon}</span>
        ) : null}
        {children}
        {iconRight && !loading && <span className="shrink-0 ml-auto pl-1">{iconRight}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
