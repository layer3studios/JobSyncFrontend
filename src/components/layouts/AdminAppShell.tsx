'use client';
// FILE: src/components/layouts/AdminAppShell.tsx
// Client shell for the admin audience — verbatim adaptation of the Vite
// AdminAppLayout. Admin sessions are seeker sessions with a whitelisted email, so
// useSeeker() is the auth source (R4). The (admin) server layout runs the isAdmin
// guard and seeds SeekerProvider so this shell can read currentUser + logout.
// Desktop-first: no footer, no mobile bottom nav.
import { useEffect, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { useSeeker } from '../../context/seeker/SeekerContext';
import { useViewport } from '../../hooks/shared/useViewport';
import AdminTopNav from './parts/AdminTopNav';

const COMPACT_BREAKPOINT_WIDTH = 1024;

export default function AdminAppShell({ children }: { children: ReactNode }) {
  const { currentUser, logout, isLoading } = useSeeker();
  const viewport = useViewport();
  const isCompact = viewport.w < COMPACT_BREAKPOINT_WIDTH;

  const pathname = usePathname();
  // Reset scroll on route change so a new page never paints mid-scroll (mirror seeker).
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);

  // Defensive: the server guard authorises above, but the client provider can mount
  // a tick before it hydrates. Render nothing rather than a half-populated nav.
  if (isLoading || !currentUser) return null;

  const navUser = {
    name: currentUser.name,
    email: currentUser.email,
    picture: currentUser.picture || undefined,
  };

  return (
    <div style={{
      minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: 'var(--paper)',
    }}>
      <AdminTopNav
        isCompact={isCompact}
        currentUser={navUser}
        onLogout={logout}
      />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* key by path forces a clean unmount/remount per route (mirror seeker). */}
        <div key={pathname} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {children}
        </div>
      </main>
    </div>
  );
}
