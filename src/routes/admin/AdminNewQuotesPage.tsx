import { useMemo, useState } from 'react';
import { GreetingHero, JobTable, Pagination, SectionHeader, StatGrid } from '@modules/shared-ui';
import { useAdminJobViews } from '../../modules/admin-panel/hooks/use-admin-jobs';

const FETCH_SIZE = 100;
const PER_PAGE   = 20;

export function AdminNewQuotesPage() {
  const { jobs, isLoading, isError } = useAdminJobViews({ per_page: FETCH_SIZE });
  const [pendingPage, setPendingPage]   = useState(1);
  const [awaitingPage, setAwaitingPage] = useState(1);

  const quoteJobs     = useMemo(() => jobs.filter((j) => j.stage === 'quote'), [jobs]);
  const pending       = useMemo(() => quoteJobs.filter((j) => j.status === 'Quote Submitted'), [quoteJobs]);
  const awaitingClient = useMemo(() => quoteJobs.filter((j) => j.status === 'Quote Approved'), [quoteJobs]);
  const artwork       = useMemo(() => quoteJobs.filter((j) => j.order === 'Artwork'), [quoteJobs]);
  const digit         = useMemo(() => quoteJobs.filter((j) => j.order === 'Digitizing'), [quoteJobs]);

  const pendingPages  = Math.ceil(pending.length / PER_PAGE);
  const awaitingPages = Math.ceil(awaitingClient.length / PER_PAGE);

  const pendingPage_items  = useMemo(
    () => pending.slice((pendingPage - 1) * PER_PAGE, pendingPage * PER_PAGE),
    [pending, pendingPage],
  );
  const awaitingPage_items = useMemo(
    () => awaitingClient.slice((awaitingPage - 1) * PER_PAGE, awaitingPage * PER_PAGE),
    [awaitingClient, awaitingPage],
  );

  if (isError) {
    return (
      <div className="page">
        <GreetingHero title="Quote Requests" subtitle="Incoming quote requests across all CS." />
        <div className="flex items-center justify-center py-16 text-[var(--crimson)] text-sm">
          Failed to load quotes. Please refresh and try again.
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <GreetingHero
        title="Quote Requests"
        subtitle="Incoming quote requests across all CS — track turnaround pressure, value, and conversion rate."
      />

      <StatGrid
        stats={[
          { accent: 'crimson', label: 'Pending Review',  value: isLoading ? '…' : pending.length },
          { accent: 'amber',   label: 'Awaiting Client', value: isLoading ? '…' : awaitingClient.length },
          { accent: 'blue',    label: 'Artwork',         value: isLoading ? '…' : artwork.length },
          { accent: 'teal',    label: 'Digitizing',      value: isLoading ? '…' : digit.length },
        ]}
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-text-faint text-sm">
          Loading quotes…
        </div>
      ) : (
        <>
          {pending.length > 0 && (
            <>
              <SectionHeader title="Pending Your Review" />
              <JobTable jobs={pendingPage_items} showActions defaultView="grid" quoteView />
              <Pagination
                page={pendingPage}
                totalPages={pendingPages}
                total={pending.length}
                perPage={PER_PAGE}
                onPageChange={setPendingPage}
              />
            </>
          )}

          {awaitingClient.length > 0 && (
            <div className="mt-6">
              <SectionHeader title="Price Sent — Awaiting Client" />
              <JobTable jobs={awaitingPage_items} showActions defaultView="grid" quoteView />
              <Pagination
                page={awaitingPage}
                totalPages={awaitingPages}
                total={awaitingClient.length}
                perPage={PER_PAGE}
                onPageChange={setAwaitingPage}
              />
            </div>
          )}

          {pending.length === 0 && awaitingClient.length === 0 && (
            <div className="flex items-center justify-center py-16 text-text-faint text-sm">
              No pending quote requests.
            </div>
          )}
        </>
      )}
    </div>
  );
}
