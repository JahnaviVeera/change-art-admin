import { useEffect, useRef, useState } from 'react';
import { Bell, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@lib/utils';
import { queryKeys } from '@lib/query-keys';
import { useIsAuthenticated, useSessionUser } from '@modules/auth/stores/auth-store';
import { UserRole, type INotification } from '@contracts';
import {
  useMarkAllRead,
  useMarkRead,
  useNotifications,
  useUnreadCount,
} from '@modules/notifications/hooks/use-notifications';

const PREVIEW_LIMIT = 8;

const ROLE_INBOX_PATH: Partial<Record<UserRole, string>> = {
  [UserRole.ADMIN]: '/admin/notifications',
};

function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86_400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86_400)}d ago`;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isAuthenticated = useIsAuthenticated();
  const user = useSessionUser();
  const queryClient = useQueryClient();

  const { data: countData } = useUnreadCount(isAuthenticated);
  const unread = countData?.count ?? 0;

  // When the user opens the panel, force a fresh count + list fetch so
  // they always see current state (handy if a socket event was missed or
  // the count somehow drifted out of sync).
  useEffect(() => {
    if (!open || !isAuthenticated) return;
    void queryClient.invalidateQueries({
      queryKey: queryKeys.notifications.all(),
      refetchType: 'all',
    });
  }, [open, isAuthenticated, queryClient]);

  // Only fetch the preview list when the panel is open — saves a request on
  // every page mount for users who never click the bell.
  const { data, isLoading } = useNotifications(
    { page: 1, per_page: PREVIEW_LIMIT },
    open && isAuthenticated,
  );

  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();

  // Close on click outside.
  useEffect(() => {
    if (!open) return undefined;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('mousedown', onClick);
    window.addEventListener('keydown', onEsc);
    return () => {
      window.removeEventListener('mousedown', onClick);
      window.removeEventListener('keydown', onEsc);
    };
  }, [open]);

  const items = data?.items ?? [];
  const inboxPath = user ? ROLE_INBOX_PATH[user.role] : undefined;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className="btn btn-outline !p-2 relative"
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <Bell aria-hidden className="w-4 h-4" />
        {unread > 0 ? (
          <span
            className="absolute -top-1 -right-1 min-w-[16px] h-4 rounded-full text-[9px] font-bold flex items-center justify-center px-1 text-white"
            style={{ background: 'var(--color-crimson, #c41e3a)' }}
          >
            {unread > 99 ? '99+' : unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label="Notifications"
          className={cn(
            'absolute right-0 top-full mt-2 w-[340px] max-w-[calc(100vw-2rem)]',
            'glass-heavy rounded-2xl z-40 overflow-hidden',
          )}
        >
          <div className="flex items-center justify-between px-3 py-2 border-b border-glass-border">
            <h2 className="text-[12px] font-bold uppercase tracking-wider">Notifications</h2>
            <button
              type="button"
              className="text-[11px] text-text-muted hover:text-[var(--color-crimson)] transition disabled:opacity-50"
              onClick={() => markAllRead.mutate()}
              disabled={unread === 0 || markAllRead.isPending}
            >
              {markAllRead.isPending ? 'Marking…' : 'Mark all read'}
            </button>
          </div>

          <div className="max-h-[360px] overflow-y-auto">
            {isLoading ? (
              <div className="text-[12px] text-text-muted text-center py-8">Loading…</div>
            ) : items.length === 0 ? (
              <div className="text-[12px] text-text-muted text-center py-8" aria-live="polite">
                You&apos;re all caught up.
              </div>
            ) : (
              <ul>
                {items.map((n) => (
                  <NotificationRow
                    key={n.id}
                    notification={n}
                    onMarkRead={() => markRead.mutate(n.id)}
                    busy={markRead.isPending}
                  />
                ))}
              </ul>
            )}
          </div>

          {inboxPath ? (
            <div className="px-3 py-2 border-t border-glass-border text-center">
              <Link
                to={inboxPath}
                className="text-[12px] font-semibold text-[var(--color-crimson)] hover:underline"
                onClick={() => setOpen(false)}
              >
                View all notifications
              </Link>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

interface RowProps {
  notification: INotification;
  onMarkRead: () => void;
  busy: boolean;
}

function NotificationRow({ notification: n, onMarkRead, busy }: RowProps) {
  return (
    <li className="border-b border-glass-border last:border-b-0">
      <div
        className={cn(
          'flex items-start gap-2 px-3 py-2.5 hover:bg-white/[0.03] transition',
          !n.is_read && 'bg-white/[0.02]',
        )}
      >
        <span
          aria-hidden
          className={cn(
            'mt-1.5 w-1.5 h-1.5 rounded-full shrink-0',
            n.is_read ? 'bg-transparent' : 'bg-[var(--color-crimson)]',
          )}
        />
        <div className="flex-1 min-w-0">
          <div className="text-[12px] font-semibold leading-tight">{n.title}</div>
          {n.body ? (
            <div className="text-[11.5px] text-text-muted mt-0.5 line-clamp-2">{n.body}</div>
          ) : null}
          <div className="text-[10.5px] text-text-faint mt-1">{timeAgo(n.created_at)}</div>
        </div>
        {!n.is_read ? (
          <button
            type="button"
            className="text-text-faint hover:text-[var(--color-crimson)] transition shrink-0 disabled:opacity-50"
            aria-label="Mark as read"
            onClick={onMarkRead}
            disabled={busy}
          >
            <Check className="w-3.5 h-3.5" aria-hidden />
          </button>
        ) : null}
      </div>
    </li>
  );
}
