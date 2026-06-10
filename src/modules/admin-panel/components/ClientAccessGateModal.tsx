import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Lock, Eye, EyeOff, X, ShieldAlert } from 'lucide-react';
import { authService } from '@modules/auth/services';
import { useSessionUser } from '@modules/auth/stores/auth-store';
import { ApiClientError } from '@lib/api-client';
import { ERROR_CODES } from '@contracts';
import type { IClient } from '@contracts';
import type { ClientModalMode } from './ClientDetailModal';

interface ClientAccessGateModalProps {
  client: IClient | null;
  mode: ClientModalMode;
  /** Called when the user successfully verifies. Opens the real detail modal. */
  onVerified: (client: IClient, mode: ClientModalMode) => void;
  onClose: () => void;
}

export function ClientAccessGateModal({
  client,
  mode,
  onVerified,
  onClose,
}: ClientAccessGateModalProps) {
  const user = useSessionUser();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (client) {
      setPassword('');
      setError(null);
      const t = setTimeout(() => inputRef.current?.focus(), 60);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [client]);

  useEffect(() => {
    if (!client) return undefined;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [client, onClose]);

  if (!client || !user) return null;

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!password.trim() || !client || !user) return;
    setError(null);
    setPending(true);
    try {
      await authService.signIn({ email: user.email, password });

      // Notify admin (fire-and-forget — does not block access if it fails)
      void import('../services/admin.service').then(({ adminService }) =>
        adminService.logClientAccess(client.id).catch(() => undefined),
      );

      onVerified(client, mode);
    } catch (err) {
      if (err instanceof ApiClientError && err.code === ERROR_CODES.INVALID_CREDENTIALS) {
        setError('Incorrect password. Please try again.');
      } else if (err instanceof ApiClientError && err.code === ERROR_CODES.NETWORK_ERROR) {
        setError('Network error. Check your connection and try again.');
      } else {
        setError('Verification failed. Please try again.');
      }
    } finally {
      setPending(false);
    }
  }

  const modal = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 anim-fade-in"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="gate-modal-title"
        className="glass-heavy rounded-2xl w-full max-w-[400px] p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 btn btn-outline !p-1.5"
          aria-label="Close"
        >
          <X aria-hidden className="w-3.5 h-3.5" />
        </button>

        {/* Icon + heading */}
        <div className="flex flex-col items-center text-center mb-5">
          <div
            className="flex items-center justify-center w-11 h-11 rounded-full mb-3"
            style={{ background: 'rgba(220,38,38,0.12)', border: '1px solid rgba(220,38,38,0.25)' }}
          >
            <ShieldAlert className="w-5 h-5" style={{ color: 'var(--crimson)' }} aria-hidden />
          </div>
          <h2 id="gate-modal-title" className="text-[15px] font-bold">
            Verify Identity to Continue
          </h2>
          <p className="text-[12.5px] text-text-muted mt-1 leading-relaxed">
            Client records are business-critical. Confirm your password to{' '}
            <strong>{mode === 'edit' ? 'edit' : 'view'}</strong> details for{' '}
            <span style={{ color: 'var(--text)' }}>
              {client.company_name ?? client.client_name}
            </span>{' '}
            ({client.client_id}).
          </p>
          <p className="text-[11px] mt-1.5" style={{ color: 'var(--text-faint)' }}>
            This access will be logged and reported to the administrator.
          </p>
        </div>

        <form onSubmit={handleVerify} className="space-y-3.5">
          <div>
            <label className="fl" htmlFor="gate-password">
              Your password
            </label>
            <div className="relative">
              <Lock
                className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-faint pointer-events-none"
                aria-hidden
              />
              <input
                ref={inputRef}
                id="gate-password"
                type={showPassword ? 'text' : 'password'}
                className="fi"
                style={{ paddingLeft: 30, paddingRight: 32 }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                disabled={pending}
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-text-faint hover:text-text"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="w-3.5 h-3.5" aria-hidden />
                ) : (
                  <Eye className="w-3.5 h-3.5" aria-hidden />
                )}
              </button>
            </div>
          </div>

          {error ? (
            <div
              className="text-[12px] px-3 py-2 rounded-md"
              style={{
                color: '#fca5a5',
                background: 'rgba(220,38,38,0.12)',
                border: '1px solid rgba(220,38,38,0.3)',
              }}
              role="alert"
            >
              {error}
            </div>
          ) : null}

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              className="btn btn-outline flex-1"
              onClick={onClose}
              disabled={pending}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-crimson flex-1"
              disabled={!password.trim() || pending}
              aria-busy={pending}
            >
              {pending ? 'Verifying…' : 'Verify & Open'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
