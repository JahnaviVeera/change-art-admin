import { useState } from 'react';
import { Pencil } from 'lucide-react';
import { GreetingHero, Pagination, Panel, StatGrid } from '@modules/shared-ui';
import { UserRole, UserSubType } from '@contracts';
import type { IUser } from '@contracts';
import { useAdminUsers } from '../../modules/admin-panel/hooks/use-admin-jobs';

const PER_PAGE = 20;

function roleBadgeClass(role: UserRole): string {
  const map: Partial<Record<UserRole, string>> = {
    [UserRole.ADMIN]:     'crimson',
    [UserRole.CS]:        'blue',
    [UserRole.TEAM_LEAD]: 'teal',
    [UserRole.DESIGNER]:  'amber',
    [UserRole.DIGITATOR]: 'purple',
    [UserRole.SEWOUT]:    'green',
    [UserRole.QC]:        'navy',
  };
  return map[role] ?? 'gray';
}

function roleLabel(role: UserRole, subType: UserSubType | null): string {
  const labels: Partial<Record<UserRole, string>> = {
    [UserRole.ADMIN]:     'Admin',
    [UserRole.CS]:        'Client Servicing',
    [UserRole.TEAM_LEAD]: 'Team Lead',
    [UserRole.DESIGNER]:  'Designer',
    [UserRole.DIGITATOR]: 'Digitator',
    [UserRole.SEWOUT]:    'Sewout',
    [UserRole.QC]:        'QC Reviewer',
  };
  const base = labels[role] ?? role;
  if (subType) return `${base} · ${subType.charAt(0) + subType.slice(1).toLowerCase()}`;
  return base;
}

function nameInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

export function AdminUsersPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useAdminUsers({ page, per_page: PER_PAGE });

  const users    = data?.items ?? [];
  const total    = data?.meta.total ?? 0;
  const totalPages = data?.meta.total_pages ?? 1;

  return (
    <div className="page">
      <GreetingHero
        title="User Management"
        subtitle="Create accounts, assign roles, gate permissions, and audit access changes."
      />

      <StatGrid
        stats={[
          { accent: 'blue',    label: 'Total Users',     value: isLoading ? '…' : total },
          { accent: 'green',   label: 'Active',          value: isLoading ? '…' : users.filter((u) => u.is_active).length },
          { accent: 'amber',   label: 'Pending Invites', value: 0 },
          { accent: 'crimson', label: 'Admins',          value: isLoading ? '…' : users.filter((u) => u.role === UserRole.ADMIN).length },
        ]}
      />

      <Panel title={`All Users${total ? ` (${total})` : ''}`}>
        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-text-faint text-sm">
            Loading users…
          </div>
        ) : isError ? (
          <div className="flex items-center justify-center py-12 text-[var(--crimson)] text-sm">
            Failed to load users. Please refresh and try again.
          </div>
        ) : users.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-text-faint text-sm">
            No users found.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u: IUser) => (
                    <tr key={u.id}>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <span
                            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0"
                            style={{
                              background:
                                'linear-gradient(135deg, var(--color-crimson), var(--color-crimson-dim))',
                            }}
                            aria-hidden
                          >
                            {nameInitials(u.name)}
                          </span>
                          <span className="font-semibold">{u.name}</span>
                        </div>
                      </td>
                      <td className="text-text-muted">{u.email}</td>
                      <td>
                        <span className={`badge ${roleBadgeClass(u.role)}`}>
                          {roleLabel(u.role, u.sub_type)}
                        </span>
                      </td>
                      <td>
                        <span className="flex items-center gap-1.5 text-[11.5px]">
                          <span
                            className={`status-dot ${u.is_active ? 'available' : 'offline'}`}
                            aria-hidden
                          />
                          {u.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-outline"
                          aria-label={`Edit ${u.name}`}
                        >
                          <Pencil aria-hidden className="w-3.5 h-3.5" />
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              page={page}
              totalPages={totalPages}
              total={total}
              perPage={PER_PAGE}
              onPageChange={setPage}
            />
          </>
        )}
      </Panel>
    </div>
  );
}
