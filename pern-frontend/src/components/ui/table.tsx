import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  className?: string;
  width?: string;
}

interface TableProps<T extends object> {
  columns: Column<T>[];
  data: T[];
  emptyMessage?: string;
  loading?: boolean;
  rowKey?: (row: T) => string;
  onRowClick?: (row: T) => void;
}

export function DataTable<T extends object>({
  columns,
  data,
  emptyMessage = 'No data found',
  loading = false,
  rowKey,
  onRowClick,
}: TableProps<T>) {
  return (
    <div className="w-full overflow-hidden rounded-2xl border border-black/[0.06] dark:border-white/[0.08]">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-black/[0.03] dark:bg-white/[0.03] border-b border-black/[0.06] dark:border-white/[0.08]">
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={col.width ? { width: col.width } : undefined}
                  className={cn(
                    'px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-widest',
                    'text-gray-500 dark:text-gray-500',
                    col.className
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center">
                  <div className="flex items-center justify-center gap-2 text-gray-400 dark:text-gray-600">
                    <div className="w-4 h-4 rounded-full border-2 border-gray-300 border-t-[#0071E3] dark:border-white/10 dark:border-t-[#0A84FF] animate-spin" />
                    <span className="text-sm">Loading…</span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-12 text-center text-sm text-gray-400 dark:text-gray-600"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, i) => (
                <tr
                  key={rowKey ? rowKey(row) : i}
                  onClick={() => onRowClick?.(row)}
                  className={cn(
                    'border-b border-black/[0.04] dark:border-white/[0.05] last:border-0',
                    'bg-white dark:bg-transparent',
                    'transition-colors duration-100',
                    onRowClick && 'cursor-pointer hover:bg-black/[0.02] dark:hover:bg-white/[0.03]'
                  )}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        'px-4 py-3 text-gray-800 dark:text-gray-200',
                        col.className
                      )}
                    >
                      {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? '—')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
