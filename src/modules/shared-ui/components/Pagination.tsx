import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@lib/utils';

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  perPage: number;
  onPageChange: (page: number) => void;
  className?: string;
}

/**
 * Standard paginator — shows page range info, prev/next, and up to 7 numbered
 * page buttons with ellipsis compression for large ranges.
 */
export function Pagination({
  page,
  totalPages,
  total,
  perPage,
  onPageChange,
  className,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const from = (page - 1) * perPage + 1;
  const to = Math.min(page * perPage, total);

  // Build the page number list: always show first/last, current ±2, with … gaps.
  const pages = buildPages(page, totalPages);

  return (
    <div className={cn('flex items-center justify-between gap-4 mt-4 flex-wrap', className)}>
      {/* Range info */}
      <span className="text-[11.5px] text-text-muted tabular-nums">
        Showing {from}–{to} of {total}
      </span>

      {/* Controls */}
      <div className="flex items-center gap-1">
        <PageBtn
          label="Previous"
          icon={<ChevronLeft className="w-3.5 h-3.5" />}
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        />

        {pages.map((p, i) =>
          p === '…' ? (
            <span key={`ellipsis-${i}`} className="px-1 text-text-faint text-[12px] select-none">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p as number)}
              aria-current={p === page ? 'page' : undefined}
              className={cn(
                'min-w-[28px] h-7 px-2 rounded text-[12px] font-medium transition-colors',
                p === page
                  ? 'bg-[var(--color-blue)] text-white'
                  : 'text-text-muted hover:text-text-main hover:bg-white/5',
              )}
            >
              {p}
            </button>
          ),
        )}

        <PageBtn
          label="Next"
          icon={<ChevronRight className="w-3.5 h-3.5" />}
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        />
      </div>
    </div>
  );
}

function PageBtn({
  label,
  icon,
  disabled,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'w-7 h-7 flex items-center justify-center rounded transition-colors',
        disabled
          ? 'text-text-faint cursor-not-allowed'
          : 'text-text-muted hover:text-text-main hover:bg-white/5',
      )}
    >
      {icon}
    </button>
  );
}

function buildPages(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const result: (number | '…')[] = [];
  const around = new Set([1, total, current - 1, current, current + 1].filter((p) => p >= 1 && p <= total));

  let prev = 0;
  for (const p of [...around].sort((a, b) => a - b)) {
    if (p - prev > 1) result.push('…');
    result.push(p);
    prev = p;
  }
  return result;
}
