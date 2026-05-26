import { useMemo, useState } from 'react';
import { GreetingHero, JobTable, Pagination, Pills, StatGrid, type PillItem } from '@modules/shared-ui';
import { useAdminJobViews } from '../../modules/admin-panel/hooks/use-admin-jobs';

// Fetched batch size — enough to cover all active jobs without pagination round-trips.
const FETCH_SIZE = 100;
// Items shown per UI page.
const PER_PAGE = 20;

export function AdminNewJobsPage() {
  const { jobs, isLoading, isError } = useAdminJobViews({ per_page: FETCH_SIZE });
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);

  // All non-delivered, non-cancelled jobs — includes quotes AND production stages.
  const active = useMemo(
    () => jobs.filter((j) => j.stage !== 'delivered' && j.status !== 'Cancelled'),
    [jobs],
  );

  const quoteJobs = useMemo(() => active.filter((j) => j.stage === 'quote'), [active]);
  const inProd    = useMemo(() => active.filter((j) => j.stage === 'junior'), [active]);
  const srReview  = useMemo(() => active.filter((j) => j.stage === 'senior'), [active]);
  const inQc      = useMemo(() => active.filter((j) => j.stage === 'qc'), [active]);
  const sewout    = useMemo(() => active.filter((j) => j.stage === 'sewout'), [active]);

  const pills: PillItem[] = [
    { id: 'all',          label: 'All',           count: active.length },
    { id: 'quote',        label: 'New Requests',  count: quoteJobs.length },
    { id: 'In Production', label: 'In Production', count: inProd.length },
    { id: 'Senior Review', label: 'Senior Review', count: srReview.length },
    { id: 'In QC',        label: 'In QC',         count: inQc.length },
    { id: 'Sewout',       label: 'Sewout',        count: sewout.length },
  ];

  const filtered = useMemo(() => {
    if (filter === 'all')   return active;
    if (filter === 'quote') return quoteJobs;
    return active.filter((j) => j.status === filter);
  }, [active, quoteJobs, filter]);

  // Client-side pagination on the filtered list.
  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const pageItems  = useMemo(
    () => filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE),
    [filtered, page],
  );

  function handleFilterChange(id: string) {
    setFilter(id);
    setPage(1);
  }

  if (isError) {
    return (
      <div className="page">
        <GreetingHero title="New Jobs" subtitle="All active jobs across the platform." />
        <div className="flex items-center justify-center py-16 text-[var(--crimson)] text-sm">
          Failed to load jobs. Please refresh and try again.
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <GreetingHero
        title="New Jobs"
        subtitle="Active pipeline — new requests, in-production work, QC, and sewout all in one view."
      />

      <StatGrid
        stats={[
          { accent: 'teal',    label: 'Total Active',  value: isLoading ? '…' : active.length },
          { accent: 'crimson', label: 'New Requests',  value: isLoading ? '…' : quoteJobs.length },
          { accent: 'amber',   label: 'In Production', value: isLoading ? '…' : inProd.length },
          { accent: 'green',   label: 'In QC',         value: isLoading ? '…' : inQc.length },
        ]}
      />

      <Pills items={pills} activeId={filter} onSelect={handleFilterChange} />

      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-text-faint text-sm">
          Loading jobs…
        </div>
      ) : pageItems.length === 0 ? (
        <div className="flex items-center justify-center py-16 text-text-faint text-sm">
          No jobs in this category.
        </div>
      ) : (
        <>
          <JobTable jobs={pageItems} showActions defaultView="grid" />
          <Pagination
            page={page}
            totalPages={totalPages}
            total={filtered.length}
            perPage={PER_PAGE}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}
