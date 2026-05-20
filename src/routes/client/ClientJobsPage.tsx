import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { SlidersHorizontal } from 'lucide-react';
import {
  GreetingHero,
  JobTable,
  JobDetailModal,
  Pills,
  StatGrid,
  Callout,
  JOBS,
  type PillItem,
} from '@modules/shared-ui';
import type { Job } from '@modules/shared-ui/mocks/jobs';

const CLIENT_ID = 'C001';

export function ClientJobsPage() {
  const myJobs = useMemo(() => JOBS.filter((j) => j.clientId === CLIENT_ID), []);
  const [filter, setFilter] = useState('all');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  const active = myJobs.filter((j) => j.stage !== 'delivered' && j.stage !== 'quote');
  const review = myJobs.filter((j) => j.status === 'In QC' || j.status === 'Quote Approved');
  const amend = myJobs.filter((j) => j.project === 'Amend');
  const delivered = myJobs.filter((j) => j.stage === 'delivered');

  const pills: PillItem[] = [
    { id: 'all', label: 'All', count: myJobs.length },
    { id: 'active', label: 'Active', count: active.length },
    { id: 'review', label: 'In QC', count: review.length },
    // ...(amend.length > 0 ? [{ id: 'amend', label: 'Modifications', count: amend.length }] : []),
    { id: 'delivered', label: 'Delivered', count: delivered.length },
  ];

  const filtered =
    filter === 'all'
      ? myJobs
      : filter === 'active'
        ? active
        : filter === 'review'
          ? review
          : filter === 'amend'
            ? amend
            : delivered;

  return (
    <div className="page">
      {/* <GreetingHero
        title="My Projects"
        subtitle="Every project we're handling for you — status timeline, latest preview, and outstanding actions."
        action={
          <Link to="/client/place-order" className="btn btn--primary btn--sm">
            Place Order
          </Link>
        }
      /> */}

      {/* <StatGrid
        stats={[
          { accent: 'blue', label: 'In Production', value: active.length },
          { accent: 'amber', label: 'Awaiting Your Review', value: review.length },
          { accent: 'crimson', label: 'Modifications', value: amend.length },
          { accent: 'green', label: 'Delivered (mo.)', value: delivered.length },
        ]}
      /> */}

      {/* {review.length > 0 && (
        <Callout tone="amber">
          {review.length} project{review.length > 1 ? 's' : ''} need
          {review.length === 1 ? 's' : ''} your attention — please review and confirm to keep
          production moving.
        </Callout>
      )} */}

      <Pills items={pills} activeId={filter} onSelect={setFilter} />

      <JobTable
        jobs={filtered}
        defaultView="grid"
        onOpen={setSelectedJob}
        controlsExtra={
          <button type="button" className="btn-filter">
            <SlidersHorizontal className="w-3.5 h-3.5" aria-hidden />
            Filter
          </button>
        }
      />

      <JobDetailModal job={selectedJob} onClose={() => setSelectedJob(null)} />
    </div>
  );
}
