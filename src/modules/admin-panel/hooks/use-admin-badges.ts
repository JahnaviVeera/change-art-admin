import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { JobStatus } from '@contracts';
import { queryKeys } from '@lib/query-keys';
import { adminService } from '../services/admin.service';

/**
 * Returns a map of nav-item-id → badge count for the admin sidebar.
 *
 * Uses the same query key as useAdminJobCards() (no extra filters) so it
 * shares the in-memory cache with any page that fetched job-cards with
 * default params. Pass `enabled = false` for non-admin roles.
 */
export function useAdminNavBadges(enabled: boolean): Record<string, number> {
  const { data } = useQuery({
    // Key matches useAdminJobCards({ per_page: 100 }) used by all list pages,
    // so badge shares the same cache entry as New Quotes / New Jobs / dashboard.
    queryKey: queryKeys.jobs.list({ per_page: 100 }),
    queryFn: () => adminService.getJobCards({ per_page: 100 }),
    staleTime: 30 * 1000,
    enabled,
  });

  return useMemo(() => {
    if (!data) return {} as Record<string, number>;
    const items = data.items;
    return {
      // Quote requests that have been submitted by a client and need review.
      // DRAFT is excluded — those haven't been submitted yet.
      'new-quotes': items.filter(
        (j) => j.status === JobStatus.QUOTE_SUBMITTED,
      ).length,

      // Orders that have been placed and are waiting to enter production.
      'new-jobs': items.filter(
        (j) =>
          j.status === JobStatus.JOB_PLACED ||
          j.status === JobStatus.CS_APPROVED ||
          j.status === JobStatus.ASSIGNED,
      ).length,
    };
  }, [data]);
}
