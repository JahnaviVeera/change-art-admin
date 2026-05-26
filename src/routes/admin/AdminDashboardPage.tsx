import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useSessionUser } from '@modules/auth/stores/auth-store';
import {
  BarChart,
  GreetingHero,
  JobTable,
  Panel,
  SectionHeader,
  StatGrid,
} from '@modules/shared-ui';
import { CheckCircle2, Send } from 'lucide-react';
import type { Job } from '@modules/shared-ui';
import { useAdminJobViews } from '../../modules/admin-panel/hooks/use-admin-jobs';
import { useAdminClients } from '../../modules/admin-panel/hooks/use-admin-clients';

export function AdminDashboardPage() {
  const user = useSessionUser();
  const firstName = user?.name.split(' ')[0] ?? 'Admin';

  const { jobs, isLoading } = useAdminJobViews({ per_page: 100 });
  const { data: clientsData } = useAdminClients();

  const active = useMemo(() => jobs.filter((j) => j.stage !== 'delivered' && j.status !== 'Cancelled'), [jobs]);
  const inProd = useMemo(() => jobs.filter((j) => j.stage === 'junior'), [jobs]);
  const inQc = useMemo(() => jobs.filter((j) => j.stage === 'qc'), [jobs]);
  const inSewout = useMemo(() => jobs.filter((j) => j.stage === 'sewout'), [jobs]);
  const delivered = useMemo(() => jobs.filter((j) => j.stage === 'delivered'), [jobs]);

  // Show the 4 most-recent active jobs (any stage except delivered/cancelled).
  // Quote-stage jobs ARE included here — a freshly submitted brief is new work.
  const newJobs = useMemo(() => active.slice(0, 4), [active]);
  const newQuotes = useMemo(() => jobs.filter((j) => j.stage === 'quote').slice(0, 4), [jobs]);

  const totalClients = clientsData?.meta.total ?? 0;

  const totalActive = inProd.length + inQc.length;
  const prodPct = totalActive ? Math.round((inProd.length / totalActive) * 100) : 50;

  const loading = (v: number | string) => isLoading ? '…' : v;

  function adminActions(_j: Job) {
    return (
      <div className="job-actions" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="btn btn-outline">View</button>
        <button type="button" className="btn btn-crimson">Edit</button>
      </div>
    );
  }

  return (
    <div className="page">
      <GreetingHero
        title={`Good ${getGreeting()}, ${firstName}`}
        subtitle="Platform-wide overview. Full access to all modules."
      />

      <StatGrid
        className="stats-grid-6"
        stats={[
          { accent: 'blue',    label: 'Open Jobs',       value: loading(active.length) },
          { accent: 'amber',   label: 'In Production',   value: loading(inProd.length) },
          { accent: 'teal',    label: 'In QC',           value: loading(inQc.length) },
          {
            accent: 'green',
            label: 'Sewout',
            value: loading(inSewout.length),
            delta: 'Jobs in sewout stage',
            deltaDirection: 'up',
            icon: <Send aria-hidden />,
          },
          {
            accent: 'purple',
            label: 'Delivered',
            value: loading(delivered.length),
            delta: 'Completed jobs',
            deltaDirection: 'up',
            icon: <CheckCircle2 aria-hidden />,
          },
          {
            accent: 'crimson',
            label: 'Total Clients',
            value: loading(totalClients),
            delta: 'Registered accounts',
            deltaDirection: 'up',
          },
        ]}
      />

      <div className="two-col">
        {/* Left — job tables */}
        <div>
          <SectionHeader
            title={<span style={{ color: '#0D9488' }}>New Jobs</span>}
            action={<Link to="/admin/new-jobs" className="sec-action-link">View All →</Link>}
          />
          {isLoading ? (
            <div className="flex items-center justify-center py-8 text-text-faint text-sm">Loading…</div>
          ) : (
            <JobTable jobs={newJobs} defaultView="grid" renderActions={adminActions} />
          )}

          <div className="mt-7">
            <SectionHeader
              title={<span style={{ color: '#D97706' }}>New Quote Requests</span>}
              action={<Link to="/admin/new-quotes" className="sec-action-link">View All →</Link>}
            />
            {isLoading ? (
              <div className="flex items-center justify-center py-8 text-text-faint text-sm">Loading…</div>
            ) : (
              <JobTable jobs={newQuotes} defaultView="grid" renderActions={adminActions} />
            )}
          </div>
        </div>

        {/* Right — stats panels */}
        <div className="flex flex-col gap-3">

          {/* Jobs Status */}
          <Panel>
            <div className="flex items-center gap-5">
              <div
                role="img"
                aria-label="Jobs status donut"
                style={{
                  width: 90, height: 90, borderRadius: '50%', flexShrink: 0,
                  background: `conic-gradient(var(--color-teal) 0% ${prodPct}%, var(--color-amber) ${prodPct}% 100%)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                }}
              >
                <div style={{
                  width: 62, height: 62, borderRadius: '50%',
                  background: 'var(--glass-bg)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  boxShadow: 'inset 0 1px 4px rgba(0,0,0,0.15)',
                }}>
                  <span style={{ fontFamily: 'Plus Jakarta Sans', fontSize: 18, fontWeight: 700, lineHeight: 1, color: 'var(--text-main)' }}>
                    {isLoading ? '…' : totalActive}
                  </span>
                  <span style={{ fontSize: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginTop: 2 }}>
                    Active
                  </span>
                </div>
              </div>

              <div className="flex-1">
                <div className="text-[11px] font-bold uppercase tracking-wider text-text-muted mb-2.5">
                  Jobs Status
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: 'var(--color-teal)' }} />
                    <span className="text-[12px] text-text-muted font-medium flex-1">In Production</span>
                    <span className="text-[12px] font-bold text-text-main">{isLoading ? '…' : inProd.length}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: 'var(--color-amber)' }} />
                    <span className="text-[12px] text-text-muted font-medium flex-1">In QC</span>
                    <span className="text-[12px] font-bold text-text-main">{isLoading ? '…' : inQc.length}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: 'var(--color-purple, #a855f7)' }} />
                    <span className="text-[12px] text-text-muted font-medium flex-1">Sewout</span>
                    <span className="text-[12px] font-bold text-text-main">{isLoading ? '…' : inSewout.length}</span>
                  </div>
                </div>
              </div>
            </div>
          </Panel>

          {/* Weekly Trend */}
          <Panel title="Weekly Trend">
            <BarChart
              items={[
                { label: 'Mon', value: 8,  height: 40 },
                { label: 'Tue', value: 11, height: 55 },
                { label: 'Wed', value: 7,  height: 35 },
                { label: 'Thu', value: 14, height: 70, color: 'var(--color-blue)' },
                { label: 'Fri', value: 20, height: 100, highlight: true },
              ]}
            />
          </Panel>

        </div>
      </div>
    </div>
  );
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
