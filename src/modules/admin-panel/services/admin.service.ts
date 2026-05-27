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
  exclude_role?: string;
  is_active?: boolean;
  page?: number;
  per_page?: number;
}

export interface UpdateClientBody {
  client_name?: string;
  company_name?: string;
  contact_name?: string;
  contact_number?: string;
  email?: string;
  location?: string;
  payment_mode?: string;
}

export interface CreateUserBody {
  email: string;
  name: string;
  password: string;
  role: string;
  sub_type?: string | null;
}

export interface UpdateUserBody {
  name?: string;
  role?: string;
  sub_type?: string | null;
  is_active?: boolean;
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

  updateClient(id: string, body: UpdateClientBody): Promise<IClient> {
    return apiClient.patch<IClient, UpdateClientBody>(`/api/v1/clients/${id}`, body);
  },

  deleteClient(id: string): Promise<void> {
    return apiClient.delete<void>(`/api/v1/clients/${id}`);
  },

  getUsers(filters: UserFilters = {}): Promise<PaginatedList<IUser>> {
    return apiClient.getPaginated<IUser>('/api/v1/users', {
      params: { per_page: 100, ...filters } as Record<string, unknown>,
    });
  },

  createUser(body: CreateUserBody): Promise<IUser> {
    return apiClient.post<IUser, CreateUserBody>('/api/v1/users', body);
  },

  updateUser(id: string, body: UpdateUserBody): Promise<IUser> {
    return apiClient.patch<IUser, UpdateUserBody>(`/api/v1/users/${id}`, body);
  },

  // Soft delete — marks the user inactive and invalidates their sessions.
  deactivateUser(id: string): Promise<IUser> {
    return apiClient.patch<IUser>(`/api/v1/users/${id}/deactivate`);
  },
};
