import { useMemo, useState, type ReactNode } from 'react';
import { Inbox, Clock, CheckCircle2, Download, Search } from 'lucide-react';

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
}
import { cn } from '@lib/utils';
import { jobImage, type Job } from '../mocks/jobs';

function statusDisplay(status: string): string {
  if (status === 'Pending Client Confirm' || status === 'Quote Approved') return 'Action Required';
  return status;
}

type JobView = 'grid' | 'list' | 'table';

interface JobTableProps {
  jobs: Job[];
  /** Default view; user can flip with the toggle. */
  defaultView?: JobView;
  /** Show built-in search input + view toggle (defaults true). */
  withControls?: boolean;
  /** Show the View/Edit action buttons on each row/card. */
  showActions?: boolean;
  /** Called when a row/card/list item is clicked. */
  onOpen?: (job: Job) => void;
  /** Override the row's Actions cell — runs the user's render fn instead. */
  renderActions?: (job: Job) => ReactNode;
  /** Empty-state copy when there are 0 jobs (after filter). */
  emptyLabel?: string;
  /** Extra elements rendered to the right of the view toggle (e.g. a Filter button). */
  controlsExtra?: ReactNode;
}

/**
 * Toggle-able job listing — table / grid / list views matching the demo's
 * `jobTable()` helper. Owns its own search + view state.
 */
export function JobTable({
  jobs,
  defaultView = 'grid',
  withControls = true,
  showActions = false,
  onOpen,
  renderActions,
  emptyLabel = 'No jobs found',
  controlsExtra,
}: JobTableProps) {
  const [view, setView] = useState<JobView>(defaultView);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return jobs;
    return jobs.filter((j) =>
      [j.id, j.ref, j.client, j.design, j.summary, j.order, j.status, j.priority]
        .join(' ')
        .toLowerCase()
        .includes(q),
    );
  }, [jobs, query]);

  if (!jobs.length) {
    return (
      <div className="jobs-root" data-view={view}>
        <EmptyState label={emptyLabel} />
      </div>
    );
  }

  const renderRowActions = renderActions ?? (showActions ? defaultActions(onOpen) : undefined);

  return (
    <div className="jobs-root" data-view={view}>
      {withControls ? (
        <div className="tbl-top">
          <div className="tbl-search-wrap">
            <Search className="tbl-search-icon" aria-hidden />
            <input
              type="text"
              className="tbl-search"
              placeholder="Search designs, job IDs..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search jobs"
            />
          </div>
          <div className="view-toggle" role="tablist" aria-label="Job views">
            {(['grid', 'list', 'table'] as const).map((v) => (
              <button
                key={v}
                type="button"
                role="tab"
                aria-selected={view === v}
                className={cn(view === v && 'on')}
                onClick={() => setView(v)}
              >
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
          {controlsExtra}
        </div>
      ) : null}

      {filtered.length === 0 ? (
        <EmptyState label={emptyLabel} />
      ) : (
        <>
          <TableView jobs={filtered} onOpen={onOpen} renderRowActions={renderRowActions} />
          <GridView jobs={filtered} onOpen={onOpen} renderRowActions={renderRowActions} />
          <ListView jobs={filtered} onOpen={onOpen} renderRowActions={renderRowActions} />
        </>
      )}
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-10 text-text-faint">
      <Inbox aria-hidden className="w-5 h-5" />
      <span className="text-sm">{label}</span>
    </div>
  );
}

function defaultActions(onOpen?: (job: Job) => void) {
  return function ActionsCell(j: Job) {
    return (
      <div className="job-actions" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="btn btn-outline"
          onClick={() => onOpen?.(j)}
          aria-label={`View ${j.id}`}
        >
          View
        </button>
      </div>
    );
  };
}

function statusBadgeAccent(status: string): string {
  const map: Record<string, string> = {
    'In QC': 'teal',
    'In Production': 'amber',
    'Senior Review': 'purple',
    Sewout: 'purple',
    Delivered: 'green',
    'Quote Submitted': 'blue',
    'Quote Approved': 'amber',
    'Pending Client Confirm': 'amber',
    Cancelled: 'gray',
    Amend: 'amber',
    'In Review': 'purple',
  };
  return map[status] || 'gray';
}

function orderBadgeAccent(order: string): string {
  const map: Record<string, string> = {
    Artwork: 'navy',
    Digitizing: 'teal',
    'Digitizing + Sewout': 'purple',
    Sewout: 'purple',
  };
  return map[order] || 'gray';
}

function priorityClass(priority: string): string {
  const map: Record<string, string> = {
    Normal: 'normal',
    Rush: 'rush',
    'Super Rush': 'super-rush',
  };
  return map[priority] || 'normal';
}

function Badge({ children, accent }: { children: ReactNode; accent: string }) {
  return <span className={cn('badge', accent)}>{children}</span>;
}

function PriorityChip({ priority }: { priority: string }) {
  return <span className={cn('priority-badge', priorityClass(priority))}>{priority}</span>;
}

function TableView({
  jobs,
  onOpen,
  renderRowActions,
}: {
  jobs: Job[];
  onOpen?: (job: Job) => void;
  renderRowActions?: (job: Job) => ReactNode;
}) {
  return (
    <div className="table-view">
      <table className="data-table">
        <thead>
          <tr>
            <th>Job</th>
            <th>Design Name</th>
            <th>Order</th>
            <th>Priority</th>
            <th>Status</th>
            <th>Created</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((j) => (
            <tr key={j.id} onClick={() => onOpen?.(j)}>
              <td>
                <div className="job-cell">
                  <img
                    className="job-thumb"
                    src={jobImage(j, 0, 160, 120)}
                    alt=""
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <span className="ref-code">{j.id}</span>
                    <div className="text-[9.5px] text-text-faint mt-0.5">{j.ref}</div>
                  </div>
                </div>
              </td>
              <td>
                <div className="flex items-center gap-2">
                  <span
                    className="font-semibold text-[12.5px] leading-tight"
                    style={{ maxWidth: 100, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}
                  >
                    {j.design}
                  </span>
                  <img
                    className="table-preview"
                    src={jobImage(j, 1, 220, 160)}
                    alt={`${j.design} preview`}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </td>
              <td><Badge accent={orderBadgeAccent(j.order)}>{j.order}</Badge></td>
              <td><PriorityChip priority={j.priority} /></td>
              <td><Badge accent={statusBadgeAccent(j.status)}>{j.status}</Badge></td>
              <td className="text-[12px] text-text-muted whitespace-nowrap">{formatDate(j.created)}</td>
              <td onClick={(e) => e.stopPropagation()}>
                {renderRowActions ? renderRowActions(j) : (
                  j.stage === 'delivered' ? (
                    <button
                      type="button"
                      className="btn btn-outline"
                      style={{ fontSize: 12, padding: '5px 12px', gap: 5 }}
                      onClick={() => onOpen?.(j)}
                    >
                      <Download className="w-3.5 h-3.5" aria-hidden />
                      Download
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-outline"
                      style={{ fontSize: 12, padding: '5px 12px' }}
                      onClick={() => onOpen?.(j)}
                    >
                      View
                    </button>
                  )
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function GridView({
  jobs,
  onOpen,
  renderRowActions,
}: {
  jobs: Job[];
  onOpen?: (job: Job) => void;
  renderRowActions?: (job: Job) => ReactNode;
}) {
  return (
    <div className="grid-view">
      {jobs.map((j) => {
        const actionRequired = j.status === 'Pending Client Confirm' || j.status === 'Quote Approved';
        const agencyPrice = j.negotiation?.agencyOffer ?? j.adminPrice ?? null;
        return (
          <article
            key={j.id}
            className={cn('job-card', actionRequired && 'job-card-attention')}
            onClick={() => onOpen?.(j)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onOpen?.(j);
              }
            }}
          >
            <div className="jc-img">
              <img
                src={jobImage(j, 2, 400, 300)}
                alt={j.design}
                loading="lazy"
                referrerPolicy="no-referrer"
              />
              <span className={cn('jc-status-overlay badge', statusBadgeAccent(j.status))}>
                {statusDisplay(j.status)}
              </span>
            </div>
            <div className="jc-body">
              <div className="jc-title">{j.design}</div>
              <div className="jc-desc">{j.summary}</div>
              <div className="jc-meta">
                <span className="jc-id">{j.id}</span>
                <Badge accent={orderBadgeAccent(j.order)}>{j.order}</Badge>
              </div>
              <div className="jc-meta">
                <PriorityChip priority={j.priority} />
                {j.etaHours ? (
                  <span className="jc-eta">
                    <Clock aria-hidden className="w-3 h-3" />
                    {j.etaHours}h
                  </span>
                ) : null}
              </div>
              {actionRequired ? (
                <div className="jc-action">
                  <CheckCircle2 aria-hidden className="w-3.5 h-3.5 mt-px shrink-0" />
                  <span>
                    Agency price ready{agencyPrice ? ` — $${agencyPrice}` : ''} ·{' '}
                    <strong>Tap to confirm &amp; start production</strong>
                  </span>
                </div>
              ) : null}
              {renderRowActions ? renderRowActions(j) : null}
            </div>
          </article>
        );
      })}
    </div>
  );
}

function ListView({
  jobs,
  onOpen,
  renderRowActions,
}: {
  jobs: Job[];
  onOpen?: (job: Job) => void;
  renderRowActions?: (job: Job) => ReactNode;
}) {
  return (
    <div className="list-view">
      {jobs.map((j) => (
        <div
          key={j.id}
          className="list-item"
          onClick={() => onOpen?.(j)}
          role="button"
          tabIndex={0}
        >
          <div className="list-thumb">
            <img
              src={jobImage(j, 3, 120, 120)}
              alt=""
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="list-body">
            <div className="font-bold text-[13px]">{j.design}</div>
            <div className="text-text-muted text-[11.5px] leading-snug">{j.summary}</div>
            <div className="text-text-muted text-[11.5px]">
              {j.id} · {j.order} · {j.status}
            </div>
            {renderRowActions ? renderRowActions(j) : null}
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <div className="text-[12px] text-text-muted whitespace-nowrap">{formatDate(j.created)}</div>
            {j.etaHours ? (
              <div
                className="text-[12px] font-semibold flex items-center gap-1 whitespace-nowrap"
                style={{ color: 'var(--color-blue)' }}
              >
                <Clock className="w-3 h-3" />
                {j.etaHours}h
              </div>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}
