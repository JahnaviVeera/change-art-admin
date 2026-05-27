import { apiClient } from '@lib/api-client';
import type { IClient, IJobCard, IUser, PaginatedList } from '@contracts';

export interface JobCardFilters {
  status?: string;
  order_type?: string;
  project_type?: string;
  client_id?: string;
  search?: string;
  page?: number;
  per_page?: number;
}

export interface ClientFilters {
  search?: string;
  page?: number;
  per_page?: number;
}

export interface UserFilters {
  role?: string;
  is_active?: boolean;
  page?: number;
  per_page?: number;
}

export const adminService = {
  getJobCards(filters: JobCardFilters = {}): Promise<PaginatedList<IJobCard>> {
    return apiClient.getPaginated<IJobCard>('/api/v1/job-cards', {
      params: { per_page: 100, ...filters } as Record<string, unknown>,
    });
  },

  getClients(filters: ClientFilters = {}): Promise<PaginatedList<IClient>> {
    return apiClient.getPaginated<IClient>('/api/v1/clients', {
      params: { per_page: 100, ...filters } as Record<string, unknown>,
    });
  },

  getUsers(filters: UserFilters = {}): Promise<PaginatedList<IUser>> {
    return apiClient.getPaginated<IUser>('/api/v1/users', {
      params: { per_page: 100, ...filters } as Record<string, unknown>,
    });
  },
};
