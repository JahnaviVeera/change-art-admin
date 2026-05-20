import { useState, useMemo, type ReactNode } from 'react';
import { useSessionUser } from '@modules/auth/stores/auth-store';
import {
  FileText,
  PlusCircle,
  Plus,
  CheckCircle2,
  Clock,
  Download,
  RotateCcw,
  Filter,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  BarChart,
  DonutChart,
  GreetingHero,
  JobTable,
  JobDetailModal,
  Panel,
  SectionHeader,
  StatGrid,
  JOBS,
  DASH_RANGES,
  type DashRange,
} from '@modules/shared-ui';
import type { Job } from '@modules/shared-ui/mocks/jobs';

// Client mock: pretend Ravi Textiles is logged in.
const CLIENT_ID = 'C001';

export function ClientDashboardPage() {
  const user = useSessionUser();
  const firstName = user?.name.split(' ')[0] ?? 'Ravi';
  const [range, setRange] = useState<DashRange>('This Month');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  const myJobs = useMemo(() => JOBS.filter((j) => j.clientId === CLIENT_ID), []);
  const active = myJobs.filter((j) => j.stage !== 'delivered' && j.stage !== 'quote');
  const quotes = myJobs.filter((j) => j.stage === 'quote');
  const delivered = myJobs.filter((j) => j.stage === 'delivered');

  const orderSplit = useMemo(() => {
    const artwork = myJobs.filter((j) => j.order === 'Artwork').length;
    const digitizing = myJobs.filter(
      (j) => j.order === 'Digitizing' || j.order === 'Digitizing + Sewout',
    ).length;
    const sewout = myJobs.filter((j) => j.order === 'Sewout').length;
    return { total: myJobs.length, artwork, digitizing, sewout };
  }, [myJobs]);

  // const activityTrend = useMemo(() => {
  //   if (!myJobs.length) return [0, 0, 0, 0, 0];
  //   const dates = myJobs.map((j) => new Date(j.created).getTime());
  //   const latest = new Date(Math.max(...dates));
  //   return Array.from({ length: 5 }, (_, i) => {
  //     const end = new Date(latest);
  //     end.setDate(latest.getDate() - (4 - i) * 7);
  //     const start = new Date(end);
  //     start.setDate(end.getDate() - 7);
  //     return myJobs.filter((j) => {
  //       const t = new Date(j.created).getTime();
  //       return t > start.getTime() && t <= end.getTime();
  //     }).length;
  //   });
  // }, [myJobs]);

  const recentJobs = myJobs.slice(0, 4);

  const inProduction = active.filter(
    (j) => j.stage === 'junior' || j.stage === 'senior' || j.stage === 'sewout',
  ).length;
  const inQC = active.filter((j) => j.stage === 'qc').length;
  const productionPct = active.length ? (inProduction / active.length) * 100 : 0;

  const productionColor = '#f59e0b';
  const qcColor = '#1e3a5f';

  const activeJobsBreakdown = (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 -ml-2 font-normal">
      <div
        role="img"
        aria-label={`${active.length} active jobs`}
        style={{
          width: 78,
          height: 78,
          borderRadius: '50%',
          background: `conic-gradient(${productionColor} 0% ${productionPct}%, ${qcColor} ${productionPct}% 100%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 54,
            height: 54,
            background: '#ffffff',
            borderRadius: '50%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span className="text-[20px] font-extrabold leading-none text-text">{active.length}</span>
          <span className="text-[8.5px] font-bold uppercase tracking-wider text-text-muted mt-0.5">
            Active
          </span>
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-text-muted mb-2">
          Active Jobs
        </div>
        <ul className="flex flex-col gap-1.5 text-[12.5px]">
          <li className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2 min-w-0">
              <span
                className="w-2.5 h-2.5 rounded-sm shrink-0"
                style={{ background: productionColor }}
                aria-hidden
              />
              <span className="text-text-muted truncate">In Production</span>
            </span>
            <span className="text-text font-semibold">{inProduction}</span>
          </li>
          <li className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2 min-w-0">
              <span
                className="w-2.5 h-2.5 rounded-sm shrink-0"
                style={{ background: qcColor }}
                aria-hidden
              />
              <span className="text-text-muted truncate">In QC</span>
            </span>
            <span className="text-text font-semibold">{inQC}</span>
          </li>
        </ul>
      </div>
    </div>
  );

  return (
    <>
      <div className="page">
        <GreetingHero
          title={
            <>
              Good {getGreeting()}, <span style={{ color: 'var(--color-crimson)' }}>{firstName}</span>
            </>
          }
          subtitle={
            <>
              You have <span className="text-text font-medium">{active.length}</span> active job
              {active.length === 1 ? '' : 's'} and{' '}
              <span className="text-text font-medium">{quotes.length}</span> pending deliver
              {quotes.length === 1 ? 'y' : 'ies'}. Here's your overview.
            </>
          }
          action={
            <div className="grid grid-cols-3 gap-2 w-full md:flex md:w-auto md:items-center">
              <div className="contents md:flex md:items-center md:gap-2">
                <select
                  className="btn btn-outline !rounded-full w-full md:w-auto text-md md:text-sm px-5 py-3 font-medium bg-white text-slate-700 border-slate-200 dark:bg-slate-900/60 dark:text-slate-200 dark:border-glass-border/40"
                  value={range}
                  onChange={(e) => setRange(e.target.value as DashRange)}
                  aria-label="Time range"
                >
                  {DASH_RANGES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
                <Link
                  to="/client/jobs"
                  className="btn btn-outline !rounded-full w-full md:w-auto justify-center gap-1.5 text-md md:text-sm px-5 py-3 bg-white text-slate-700 border-slate-200 dark:bg-slate-900/60 dark:text-slate-200 dark:border-glass-border/40"
                >
                  <FileText aria-hidden className="w-3.5 h-3.5" />
                  View Projects
                </Link>
                <Link
                  to="/client/quote"
                  className="btn btn-outline !rounded-full w-full md:w-auto justify-center gap-1.5 text-md md:text-sm px-5 py-3 bg-white text-slate-700 border-slate-200 dark:bg-slate-900/60 dark:text-slate-200 dark:border-glass-border/40"
                >
                  <PlusCircle aria-hidden className="w-3.5 h-3.5" />
                  Request Quote
                </Link>
              </div>
              <Link
                to="/client/place-order"
                className="btn btn-crimson !rounded-full col-span-3 md:col-span-1 w-full md:w-auto justify-center gap-1.5 text-sm px-5 py-3 font-bold whitespace-nowrap bg-[#A81C30] hover:bg-[#8B1424] text-white shadow-sm mt-1 md:mt-0"
              >
                <Plus aria-hidden className="w-3.5 h-3.5" />
                Place Order
              </Link>
            </div>
          }
        />

        <hr className="border-slate-300/80 dark:border-glass-border/40 my-6" />

        <StatGrid
          className="!grid-cols-2 md:!grid-cols-3"
          stats={[
            {
              accent: 'crimson',
              value: activeJobsBreakdown,
            },
            {
              accent: 'green',
              label: 'Delivered',
              value: delivered.length,
              delta: '↑ 2 this month',
              deltaDirection: 'up',
              icon: <CheckCircle2 aria-hidden />,
            },
            {
              accent: 'gold',
              label: 'Pending Quotes',
              value: quotes.length,
              delta: quotes.length === 0 ? 'All approved' : `${quotes.length} awaiting review`,
              icon: <Clock aria-hidden />,
            },
          ]}
        />

        <div className="two-col">
          <div>
            <SectionHeader
              title="Recent Jobs"
              action={<Link to="/client/jobs">View all →</Link>}
            />
            <JobTable
              jobs={recentJobs}
              defaultView="grid"
              withControls
              emptyLabel="No jobs yet."
              onOpen={setSelectedJob}
            // controlsExtra={
            //   <button
            //     type="button"
            //     className="btn btn-outline !rounded-full"
            //     style={{ padding: '6px 12px', fontSize: 12 }}
            //   >
            //     <Filter aria-hidden className="w-3.5 h-3.5" />
            //     Filter
            //   </button>
            // }
            />
          </div>

          <div className="flex flex-col gap-3">
            <Panel title="Quick Actions" className="panel-blue">
              <div className="flex flex-col gap-2.5">
                <QuickActionTile
                  to="/client/place-order"
                  icon={<Plus className="w-[22px] h-[22px]" />}
                  tint="blue"
                  title="Place New Order"
                  description="Submit artwork, digitizing or print orders"
                  variant="highlighted"
                />
                <QuickActionTile
                  to="/client/tracking"
                  icon={<Download className="w-[22px] h-[22px]" />}
                  tint="teal"
                  title="Download Files"
                  description="Get your delivered project files"
                />
                <QuickActionTile
                  to="/client/jobs"
                  icon={<RotateCcw className="w-[22px] h-[22px]" />}
                  tint="crimson"
                  title="Request Modification"
                  description="Revise a delivered job"
                />
                <QuickActionTile
                  to="/client/place-order"
                  icon={<FileText className="w-[22px] h-[22px]" />}
                  tint="amber"
                  title="Continue Draft"
                  description="Winter Collection Print · Saved 2 min ago"
                  badge="1 Draft"
                  variant="draft"
                />
              </div>
            </Panel>

            <Panel title="Order Split">
              <div className="flex items-center justify-center min-h-[140px] w-full">
                <div style={{ width: '100%', maxWidth: '280px' }}>
                  <DonutChart
                    centerValue={orderSplit.total}
                    centerLabel="Orders"
                    showCount
                    size={100}
                    innerBg="#ffffff"
                    slices={[
                      { label: 'Artwork', value: orderSplit.artwork, color: '#002868' },
                      { label: 'Digitizing', value: orderSplit.digitizing, color: 'var(--color-crimson)' },
                      { label: 'Sewout', value: orderSplit.sewout, color: 'var(--color-amber)' },
                    ]}
                  />
                </div>
              </div>
            </Panel>

            {/* <Panel title="Activity Trend" className="panel-green">
            <BarChart
              items={activityTrend.map((v: number, i: number) => ({
                label: String(i + 1),
                value: v,
                height: (v / Math.max(...activityTrend, 1)) * 100,
                color: i === activityTrend.length - 2 ? '#002868' : '#F2F4F8',
                // highlight: i === activityTrend.length - 1,
              }))}
            />
          </Panel> */}
          </div>
        </div>
      </div>

      <JobDetailModal job={selectedJob} onClose={() => setSelectedJob(null)} />
    </>
  );
}


interface QuickActionTileProps {
  to: string;
  icon: ReactNode;
  tint: 'blue' | 'teal' | 'crimson' | 'amber';
  title: string;
  description: string;
  badge?: string;
  /** 'highlighted' = solid tinted border; 'draft' = dashed border + tinted text. */
  variant?: 'highlighted' | 'draft';
}

function QuickActionTile({
  to,
  icon,
  tint,
  title,
  description,
  badge,
  variant,
}: QuickActionTileProps) {
  const tintMap: Record<QuickActionTileProps['tint'], { bg: string; fg: string }> = {
    blue: { bg: 'rgba(59, 130, 246, 0.12)', fg: 'var(--color-blue)' },
    teal: { bg: 'rgba(45, 212, 191, 0.14)', fg: 'var(--color-teal)' },
    crimson: { bg: 'rgba(196, 30, 58, 0.12)', fg: 'var(--color-crimson)' },
    amber: { bg: 'rgba(245, 158, 11, 0.14)', fg: 'var(--color-amber)' },
  };
  const tone = tintMap[tint];
  const isHighlighted = variant === 'highlighted';
  const isDraft = variant === 'draft';
  const textColor = isDraft ? tone.fg : undefined;
  return (
    <Link
      to={to}
      className="flex items-center gap-3 rounded-xl border p-3 transition hover:border-glass-border-bright"
      style={{
        borderColor: isHighlighted || isDraft ? tone.fg : 'var(--glass-border)',
        borderStyle: isDraft ? 'dashed' : 'solid',
        background: 'rgba(255,255,255,0.04)',
      }}
    >
      <span
        aria-hidden
        className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: tone.bg, color: tone.fg }}
      >
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <div
          className="text-[13.5px] font-bold leading-tight"
          style={{ color: textColor ?? 'var(--text-main)' }}
        >
          {title}
        </div>
        <div
          className="text-[11.5px] leading-snug mt-1"
          style={{ color: textColor ?? 'var(--text-muted)' }}
        >
          {description}
        </div>
      </div>
      {badge ? (
        <span
          className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0"
          style={{ background: 'rgba(245, 158, 11, 0.18)', color: 'var(--color-amber)' }}
        >
          {badge}
        </span>
      ) : null}
    </Link>
  );
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Morning';
  if (h < 17) return 'Afternoon';
  return 'Evening';
}
