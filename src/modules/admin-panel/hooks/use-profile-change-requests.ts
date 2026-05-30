import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { queryKeys } from '@lib/query-keys';
import { toastApiError } from '@lib/toast-error';
import {
  adminService,
  type ProfileChangeRequestFilters,
} from '../services/admin.service';

export function useProfileChangeRequests(filters: ProfileChangeRequestFilters = {}) {
  return useQuery({
    queryKey: queryKeys.clients.changeRequests(filters as Record<string, unknown>),
    queryFn: () => adminService.listProfileChangeRequests(filters),
    staleTime: 30 * 1000,
  });
}

export function useApproveProfileChangeRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) =>
      adminService.approveProfileChangeRequest(id, note),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.clients.all() });
      toast.success('Profile change approved');
    },
    onError: (err) => toastApiError(err),
  });
}

export function useRejectProfileChangeRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) =>
      adminService.rejectProfileChangeRequest(id, note),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.clients.all() });
      toast.success('Profile change rejected');
    },
    onError: (err) => toastApiError(err),
  });
}
