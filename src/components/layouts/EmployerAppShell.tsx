'use client';
// FILE: src/components/layouts/EmployerAppShell.tsx
// Client shell for the employer audience — verbatim adaptation of the Vite
// EmployerAppLayout. The (employer)/(app) server layout runs the auth guard and
// seeds EmployerProvider; this shell reads that session and renders the persistent
// EmployerTopNav. Desktop-first: no footer, no mobile bottom nav (D1).
import { useEffect, useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { useEmployer } from '../../context/employer/EmployerContext';
import { useViewport } from '../../hooks/shared/useViewport';
import { listMembers } from '../../api/employer-team-api';
import type { Role } from '../../types/employer-team';
import EmployerTopNav from './parts/EmployerTopNav';

const COMPACT_BREAKPOINT_WIDTH = 1024;

export default function EmployerAppShell({ children }: { children: ReactNode }) {
  const { employerUser, company, logout } = useEmployer();
  const viewport = useViewport();
  const isCompact = viewport.w < COMPACT_BREAKPOINT_WIDTH;
  const [role, setRole] = useState<Role | null>(null);

  const pathname = usePathname();
  // Reset scroll on route change so a new page never paints mid-scroll (mirror seeker).
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);

  // The /me session does not carry the company role, so resolve the viewer's role
  // once from the roster to gate the Settings nav link. Only meaningful after a
  // company exists (the roster endpoint is company-scoped); failures leave it null.
  const employerUserId = employerUser?.id ?? null;
  const hasCompany = Boolean(company);
  useEffect(() => {
    if (!hasCompany || !employerUserId) { setRole(null); return; }
    let active = true;
    listMembers()
      .then((members) => {
        if (!active) return;
        setRole(members.find((m) => m.employerUserId === employerUserId)?.role ?? null);
      })
      .catch(() => { if (active) setRole(null); });
    return () => { active = false; };
  }, [hasCompany, employerUserId]);

  // Defensive: the server guard authenticates above, but the client provider can
  // mount a tick before it hydrates. Render nothing rather than a half-populated nav.
  if (!employerUser) return null;

  const currentUser = {
    name: employerUser.name,
    email: employerUser.email,
    picture: employerUser.picture ?? undefined,
  };

  return (
    <div style={{
      minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: 'var(--paper)',
    }}>
      <EmployerTopNav
        isCompact={isCompact}
        currentUser={currentUser}
        companyName={company?.name ?? null}
        role={role}
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
