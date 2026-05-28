import { cn } from '@lib/utils';

export interface BarChartItem {
  label: string;
  value: number;
  /** % height inside the chart container. */
  height: number;
  /** Override bar color (defaults to neutral surface tone). */
  color?: string;
  /** Highlight this bar with the crimson accent. */
  highlight?: boolean;
}

interface BarChartProps {
  items: BarChartItem[];
  className?: string;
  height?: number;
}

/**
 * Simple vertical bar chart — used for activity trend / weekly rejection
 * rate / jobs-this-week panels in the demo. Bars are pre-sized as a percentage
 * by the caller so the same chart can render different ranges.
 */
export function BarChart({ items, className, height = 110 }: BarChartProps) {
  return (
    <div className={cn('w-full', className)}>
      <div
        className="flex items-end gap-2.5"
        style={{ height, paddingTop: 18, borderBottom: '1px solid var(--glass-border)' }}
      >
        {items.map((b) => (
          <div
            key={b.label}
            className="flex-1 rounded-t relative transition-all"
            style={{
              height: `${b.height}%`,
              // Default uses a theme-aware glass-border tone so the bar stays
              // visible on both dark (white-tinted) and light (slate-tinted) bg.
              background: b.color ?? (b.highlight ? 'var(--color-crimson)' : 'var(--glass-border-bright)'),
              boxShadow: b.highlight ? '0 -2px 10px rgba(196,30,58,0.18)' : undefined,
            }}
            title={`${b.label}: ${b.value}`}
          >
            <div
              className="absolute -top-5 left-0 right-0 text-center text-[10.5px] font-mono"
              style={{
                color: b.highlight ? 'var(--color-crimson)' : 'var(--text-muted)',
                fontWeight: b.highlight ? 700 : 400,
              }}
            >
              {b.value}
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-2 text-[10.5px] font-bold uppercase tracking-wider text-text-faint">
        {items.map((b) => (
          <span
            key={b.label}
            className="flex-1 text-center"
            style={{ color: b.highlight ? 'var(--color-crimson)' : undefined }}
          >
            {b.label}
          </span>
        ))}
      </div>
    </div>
  );
}
