import { useCallback, useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { Sidebar } from '@modules/shared-ui/components/Sidebar';
import { Topbar } from '@modules/shared-ui/components/Topbar';
import { MobileBottomNav } from '@modules/shared-ui/components/MobileBottomNav';
import { useSessionUser } from '@modules/auth/stores/auth-store';
import { NAV_CONFIG } from '@modules/shared-ui/nav-config';
import { UserRole } from '@contracts';

interface DashboardLayoutProps {
  children: ReactNode;
}

/**
 * The authenticated shell: sidebar (slide-out on mobile) + topbar +
 * scrollable content + mobile bottom nav. Resolves the current page's
 * title by matching the active route against the role's NAV_CONFIG.
 */
export function DashboardLayout({ children }: DashboardLayoutProps) {
  const location = useLocation();
  const user = useSessionUser();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const closeMobile = useCallback(() => setMobileNavOpen(false), []);
  const openMobile = useCallback(() => setMobileNavOpen(true), []);

  const title = pageTitleFromRoute(user?.role, location.pathname);
  const resolvedSubtitle = title.subtitle?.replace('{user.name}', user?.name || '');

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <Sidebar collapsedOnMobile={!mobileNavOpen} onNavigateMobile={closeMobile} />

      {/* Mobile overlay */}
      {mobileNavOpen ? (
        <button
          type="button"
          aria-label="Close navigation"
          className="md:hidden fixed inset-0 z-30 bg-black/40 anim-fade-in"
          onClick={closeMobile}
        />
      ) : null}

      {/* Main column */}
      <div className="flex-1 min-w-0 flex flex-col md:ml-[var(--sidebar-w)]">
        <Topbar title={title.title} subtitle={resolvedSubtitle} onOpenMobileNav={openMobile} />

        <main
          id="main-content"
          className="flex-1 overflow-y-auto px-4 md:px-6 py-[22px] pb-[calc(var(--mobile-nav-h)+1rem)] md:pb-[22px] anim-fade-in"
          tabIndex={-1}
        >
          {children}
        </main>

        <MobileBottomNav />
      </div>
    </div>
  );
}

function pageTitleFromRoute(
  role: UserRole | undefined,
  pathname: string,
): { title: string; subtitle?: string } {
  if (!role) return { title: 'Dashboard' };
  const cfg = NAV_CONFIG[role];
  for (const section of cfg.sections) {
    const match = section.items.find((it) => it.to === pathname);
    if (match) {
      return { title: match.label, subtitle: match.subtitle || cfg.label };
    }
  }
  return { title: cfg.label };
}
