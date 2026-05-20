import { Menu, Moon, Search, SendHorizontal, Sun } from 'lucide-react';
import { useTheme } from '@providers/ThemeProvider';
import { Theme, UserRole } from '@contracts';
import { useSessionUser } from '@modules/auth/stores/auth-store';
import { initials } from '@lib/utils';
import { NotificationBell } from './NotificationBell';
import { NAV_CONFIG } from '@modules/shared-ui/nav-config';

interface TopbarProps {
  title: string;
  subtitle?: string;
  onOpenMobileNav: () => void;
}

/**
 * Top app bar — page title + AI search placeholder + bell + theme + avatar.
 * Upgraded in v1 to a gorgeous, premium rounded glass interface as requested, using NAV_CONFIG dynamic metadata.
 */
export function Topbar({ title, subtitle, onOpenMobileNav }: TopbarProps) {
  const { theme, toggleTheme } = useTheme();
  const user = useSessionUser();

  return (
    <header
      className="sticky top-0 z-30 h-[var(--topbar-h)] px-4 md:px-6 flex items-center gap-3 border-b border-glass-border glass"
      aria-label="Top bar"
    >
      <button
        type="button"
        onClick={onOpenMobileNav}
        className="md:hidden btn btn-outline !p-2"
        aria-label="Open navigation"
      >
        <Menu aria-hidden className="w-4 h-4" />
      </button>

      <div className="min-w-0 flex-1">
        <h1 className="text-[17px] font-bold text-text-main leading-tight truncate">{title}</h1>
        {subtitle ? (
          <p className="text-[11.5px] text-text-muted mt-0.5 font-medium truncate">{subtitle}</p>
        ) : null}
      </div>

      {/* AI search placeholder — premium pills-shaped component matching specifications */}
      <label className="hidden lg:flex items-center w-full max-w-[320px] relative" htmlFor="ai-search">
        <Search aria-hidden className="w-4 h-4 text-text-muted dark:text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          id="ai-search"
          type="text"
          placeholder="Ask AI anything..."
          disabled
          aria-disabled="true"
          title="AI search is coming in a future release"
          className="w-full bg-[#f1f5f9] dark:bg-navy-light/40 border border-slate-200/50 dark:border-glass-border rounded-full pl-10 pr-11 py-2 text-[12.5px] text-text-main placeholder-text-faint dark:placeholder-text-muted focus:outline-none disabled:cursor-not-allowed transition-all"
        />
        <button
          type="button"
          disabled
          aria-label="Send query"
          className="w-7 h-7 rounded-full flex items-center justify-center bg-[#002868] dark:bg-crimson text-white absolute right-1.5 top-1/2 -translate-y-1/2 opacity-90 cursor-not-allowed hover:opacity-100 transition-opacity"
        >
          <SendHorizontal aria-hidden className="w-3.5 h-3.5" />
        </button>
      </label>

      <div className="h-6 w-[1px] bg-slate-200 dark:bg-glass-border/40 mx-1 hidden md:block" />

      <NotificationBell />

      <button
        type="button"
        onClick={toggleTheme}
        className="w-9 h-9 rounded-full flex items-center justify-center border border-slate-200/50 dark:border-glass-border bg-[#f1f5f9] dark:bg-navy-light/40 hover:bg-slate-200 dark:hover:bg-navy-ink text-text-main transition"
        aria-label={theme === Theme.DARK ? 'Switch to light theme' : 'Switch to dark theme'}
      >
        {theme === Theme.DARK ? (
          <Sun aria-hidden className="w-4 h-4 text-text-main" />
        ) : (
          <Moon aria-hidden className="w-4 h-4 text-text-main" />
        )}
      </button>

      {user ? (
        <>
          <div className="h-6 w-[1px] bg-slate-200 dark:bg-glass-border/40 mx-1 hidden md:block" />
          <div
            className="hidden md:flex items-center gap-3 pl-1"
            aria-label="Account"
          >
            <div
              aria-hidden
              className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[13px] font-bold flex-shrink-0"
              style={{
                background: 'linear-gradient(135deg, var(--color-crimson), var(--color-crimson-dim))',
                border: '1.5px solid rgba(255,255,255,0.2)',
              }}
            >
              {initials(user.name)}
            </div>
            <div className="leading-tight flex flex-col">
              <div className="text-[13px] font-bold text-text-main truncate max-w-[140px]">
                {user.name}
              </div>
              <div className="text-[10.5px] text-text-muted font-medium truncate max-w-[140px]">
                {user.role === UserRole.CLIENT ? 'Client Portal' : NAV_CONFIG[user.role]?.label || 'Production Platform'}
              </div>
            </div>
          </div>
        </>
      ) : null}
    </header>
  );
}
