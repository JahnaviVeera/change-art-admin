import { useState } from 'react';
import { Pencil } from 'lucide-react';
import { GreetingHero, Pagination, Panel, StatGrid } from '@modules/shared-ui';
import { PaymentMode } from '@contracts';
import type { IClient } from '@contracts';
import { useAdminClients } from '../../modules/admin-panel/hooks/use-admin-clients';
import {
  ClientDetailModal,
  type ClientModalMode,
} from '../../modules/admin-panel/components/ClientDetailModal';

const PER_PAGE = 20;

function formatPaymentMode(mode: PaymentMode | null): string {
  if (!mode) return '—';
  const map: Record<PaymentMode, string> = {
    [PaymentMode.BANK_TRANSFER]: 'Bank Transfer',
    [PaymentMode.CASH]: 'Cash',
    [PaymentMode.CARD]: 'Card',
    [PaymentMode.CREDIT]: 'Credit',
  };
  return map[mode] ?? mode;
}

function currentMonthCount(items: { created_at: string }[]): number {
  const now = new Date();
  return items.filter((c) => {
    const d = new Date(c.created_at);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }).length;
}

export function AdminClientsPage() {
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<{ client: IClient; mode: ClientModalMode } | null>(null);

  const { data, isLoading, isError } = useAdminClients({ page, per_page: PER_PAGE });

  const clients = data?.items ?? [];
  const total = data?.meta.total ?? 0;
  const totalPages = data?.meta.total_pages ?? 1;

  return (
    <div className="page">
      <GreetingHero
        title="Client Management"
        subtitle="Master client directory — onboarding state, lifetime spend, churn risk, and assigned CS owner."
      />

      <StatGrid
        stats={[
          { accent: 'blue',    label: 'Active Accounts', value: isLoading ? '…' : total },
          { accent: 'green',   label: 'New (mo.)',        value: isLoading ? '…' : currentMonthCount(clients) },
          { accent: 'crimson', label: 'At Risk',          value: 0 },
          {
            accent: 'gold',
            label: 'Top Client',
            value: isLoading ? '…' : (clients[0]?.company_name ?? clients[0]?.client_name ?? '—'),
          },
        ]}
      />

      <Panel title={`All Clients${total ? ` (${total})` : ''}`}>
        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-text-faint text-sm">
            Loading clients…
          </div>
        ) : isError ? (
          <div className="flex items-center justify-center py-12 text-[var(--crimson)] text-sm">
            Failed to load clients. Please refresh and try again.
          </div>
        ) : clients.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-text-faint text-sm">
            No clients found.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Client ID</th>
                    <th>Contact Name</th>
                    <th>Company</th>
                    <th>Phone</th>
                    <th>Email</th>
                    <th>Location</th>
                    <th>Payment</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map((c) => (
                    <tr
                      key={c.id}
                      className="cursor-pointer"
                      onClick={() => setSelected({ client: c, mode: 'view' })}
                    >
                      <td><span className="ref-code">{c.client_id}</span></td>
                      <td className="font-semibold">{c.contact_name}</td>
                      <td className="text-text-muted">{c.company_name ?? '—'}</td>
                      <td className="font-mono text-[11.5px] text-text-muted">{c.contact_number}</td>
                      <td className="text-text-muted">{c.email}</td>
                      <td className="text-text-muted">{c.location ?? '—'}</td>
                      <td><span className="badge gray">{formatPaymentMode(c.payment_mode)}</span></td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          className="btn btn-outline"
                          aria-label={`Edit ${c.contact_name}`}
                          onClick={() => setSelected({ client: c, mode: 'edit' })}
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

      <ClientDetailModal
        client={selected?.client ?? null}
        mode={selected?.mode}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}
