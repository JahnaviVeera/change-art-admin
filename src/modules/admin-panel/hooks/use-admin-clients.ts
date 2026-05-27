import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@lib/query-keys';
import { adminService, type ClientFilters } from '../services/admin.service';

export function useAdminClients(filters: ClientFilters = {}) {
  return useQuery({
    queryKey: queryKeys.clients.list(filters as Record<string, unknown>),
    queryFn: () => adminService.getClients(filters),
    staleTime: 2 * 60 * 1000,
  });
}
