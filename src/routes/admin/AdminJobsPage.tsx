import { useMemo, useState } from 'react';
import { GreetingHero, JobTable, Pagination, Pills, type PillItem } from '@modules/shared-ui';
import { useAdminJobViews } from '../../modules/admin-panel/hooks/use-admin-jobs';

const PER_PAGE = 20;

export function AdminJobsPage() {
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState('all');

  const { jobs, total, isLoading, isError } = useAdminJobViews({ page, per_page: PER_PAGE });
  const totalPages = Math.ceil((total || 0) / PER_PAGE);

  // Order-type filter is applied client-side on the current page's data.
  const filtered = useMemo(() => {
    if (filter === 'all') return jobs;
    if (filter === 'Artwork') return jobs.filter((j) => j.order === 'Artwork');
    if (filter === 'Digitizing') return jobs.filter((j) => j.order === 'Digitizing');
    if (filter === 'Sewout')
      return jobs.filter((j) => j.order === 'Digitizing + Sewout' || j.order === 'Sewout');
    return jobs;
  }, [jobs, filter]);

  const pills: PillItem[] = [
    { id: 'all',       label: 'All',       count: jobs.length },
    { id: 'Artwork',   label: 'Artwork',   count: jobs.filter((j) => j.order === 'Artwork').length },
    { id: 'Digitizing',label: 'Digitizing',count: jobs.filter((j) => j.order === 'Digitizing').length },
    {
      id: 'Sewout',
      label: 'Sewout',
      count: jobs.filter((j) => j.order === 'Digitizing + Sewout' || j.order === 'Sewout').length,
    },
  ];

  function handleFilterChange(id: string) {
    setFilter(id);
    setPage(1);
  }

  if (isError) {
    return (
      <div className="page">
        <GreetingHero title="All Jobs" subtitle="Every job across the platform." />
        <div className="flex items-center justify-center py-16 text-[var(--crimson)] text-sm">
          Failed to load jobs. Please refresh and try again.
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <GreetingHero
        title="All Jobs"
        subtitle={`Every job across the platform — search by client, stage, owner, or revenue band.${total > 0 ? ` ${total} total.` : ''}`}
      />

      <Pills items={pills} activeId={filter} onSelect={handleFilterChange} />

      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-text-faint text-sm">
          Loading jobs…
        </div>
      ) : (
        <>
          <JobTable jobs={filtered} showActions defaultView="grid" />
          <Pagination
            page={page}
            totalPages={totalPages}
            total={total}
            perPage={PER_PAGE}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}
