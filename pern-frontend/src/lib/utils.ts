import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, parseISO } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date, fmt = 'PPP') {
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return format(d, fmt);
  } catch {
    return '—';
  }
}

export function formatDateShort(date: string | Date) {
  return formatDate(date, 'MMM d, yyyy');
}

export const GRADE_LETTERS = ['S', 'A', 'B', 'C', 'D', 'E', 'F'] as const;

export const GRADE_COLORS: Record<string, string> = {
  S: 'text-emerald-600 dark:text-emerald-400',
  A: 'text-blue-600 dark:text-blue-400',
  B: 'text-sky-600 dark:text-sky-400',
  C: 'text-amber-600 dark:text-amber-400',
  D: 'text-orange-600 dark:text-orange-400',
  E: 'text-red-500 dark:text-red-400',
  F: 'text-red-700 dark:text-red-500',
};

export const ROLE_COLORS: Record<string, string> = {
  STUDENT: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  FACULTY: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  ADMIN: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  DEVELOPER: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
};

export const ROLE_LABELS: Record<string, string> = {
  STUDENT: 'Student',
  FACULTY: 'Faculty',
  ADMIN: 'Admin',
  DEVELOPER: 'Developer',
};

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function getErrorMessage(err: unknown): string {
  if (err && typeof err === 'object') {
    const e = err as { response?: { data?: { error?: string; message?: string } }; message?: string };
    return (
      e.response?.data?.error ||
      e.response?.data?.message ||
      e.message ||
      'An unexpected error occurred'
    );
  }
  return 'An unexpected error occurred';
}
