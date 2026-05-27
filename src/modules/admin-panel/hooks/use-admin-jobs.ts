import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { UserRole } from '@contracts';
import { queryKeys } from '@lib/query-keys';
import type { Job } from '@modules/shared-ui';
import { adminService, type JobCardFilters, type UserFilters } from '../services/admin.service';
import { adaptJobCard, type ClientInfo } from '../adapters/job-view';
import { useAdminClients } from './use-admin-clients';

// Exported so pages that explicitly need user name resolution can opt in.
// CLIENT accounts are excluded by default — User Management only covers
// internal staff; client records live in the Clients tab.
export function useAdminUsers(filters: UserFilters = {}) {
  return useQuery({
    queryKey: queryKeys.users.list({ exclude_role: UserRole.CLIENT, ...filters } as Record<string, unknown>),
    queryFn: () => adminService.getUsers({ exclude_role: UserRole.CLIENT, ...filters }),
    staleTime: 5 * 60 * 1000,
  });
}

export function useAdminJobCards(filters: JobCardFilters = {}) {
  return useQuery({
    queryKey: queryKeys.jobs.list(filters as Record<string, unknown>),
    queryFn: () => adminService.getJobCards(filters),
    // 30-second stale window prevents job-cards from re-fetching on every
    // navigation while still keeping the list reasonably fresh.
    staleTime: 30 * 1000,
  });
}

export function useAdminJobViews(filters: JobCardFilters = {}): {
  jobs: Job[];
  total: number;
  isLoading: boolean;
  isError: boolean;
  error: unknown;
} {
  // Two queries only — job-cards (primary) + clients (client name resolution).
  // Users are NOT eagerly fetched here; assignedTo falls back to null which
  // the UI renders as "Pending". Pages that need user names call useAdminUsers.
  const jobsQuery = useAdminJobCards(filters);
  const clientsQuery = useAdminClients();

  const clientsMap = useMemo(() => {
    const map = new Map<string, ClientInfo>();
    for (const c of clientsQuery.data?.items ?? []) {
      map.set(c.id, {
        name: c.company_name ?? c.client_name,
        clientId: c.client_id,
      });
    }
    return map;
  }, [clientsQuery.data]);

  const jobs = useMemo<Job[]>(() => {
    if (!jobsQuery.data) return [];
    // Pass empty usersMap — assignedTo resolves to null → shown as "Pending".
    return jobsQuery.data.items.map((card) => adaptJobCard(card, clientsMap, new Map()));
  }, [jobsQuery.data, clientsMap]);

  return {
    jobs,
    total: jobsQuery.data?.meta.total ?? 0,
    isLoading: jobsQuery.isLoading,
    isError: jobsQuery.isError,
    error: jobsQuery.error,
  };
}
