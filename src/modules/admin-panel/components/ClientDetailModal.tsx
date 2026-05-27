import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import type { IClient } from '@contracts';
import { PaymentMode } from '@contracts';

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

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
}

interface ClientDetailModalProps {
  client: IClient | null;
  onClose: () => void;
}

export function ClientDetailModal({ client, onClose }: ClientDetailModalProps) {
  useEffect(() => {
    if (!client) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [client, onClose]);

  if (!client) return null;

  const rows: [string, string][] = [
    ['Client ID', client.client_id],
    ['Full Name', client.client_name],
    ['Company', client.company_name ?? '—'],
    ['Contact Person', client.contact_name],
    ['Phone', client.contact_number],
    ['Email', client.email],
    ['Location', client.location ?? '—'],
    ['Payment Mode', formatPaymentMode(client.payment_mode)],
    ['Member Since', formatDate(client.date)],
    ['Record Created', formatDate(client.created_at)],
  ];

  const modal = (
    <div
      className="modal-overlay open"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal
      aria-label={`Client details: ${client.client_name}`}
    >
      <div className="modal" style={{ maxWidth: 520 }}>

        {/* Header */}
        <div className="modal-top">
          <div style={{ flex: 1 }}>
            <div className="modal-job-id">{client.client_id}</div>
            <div className="modal-title">{client.company_name ?? client.client_name}</div>
            <div className="modal-tags">
              <span className="badge gray">{formatPaymentMode(client.payment_mode)}</span>
              <span className="badge blue">{client.email}</span>
            </div>
          </div>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="w-3.5 h-3.5" aria-hidden />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          <div className="m-sec-title">Client Details</div>
          {rows.map(([key, val]) => (
            <div key={key} className="f-row">
              <div className="f-key">{key}</div>
              <div className="f-val">{val}</div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="modal-actions">
          <button type="button" className="btn btn-outline" onClick={onClose}>
            Close
          </button>
        </div>

      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
