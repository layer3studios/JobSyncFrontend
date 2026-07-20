// FILE: src/app/(admin)/admin/layout.tsx
// Admin guard (D4). Server Component: requires a signed-in seeker whose /me payload
// reports isAdmin. A missing session → /login; a non-admin → home. Admin sessions
// are seeker sessions, so we seed SeekerProvider from the resolved /me payload — the
// client AdminAppShell reads currentUser + logout from it (mirrors the Vite
// AdminAppLayout, which used useSeeker as the admin auth source).
import { redirect } from 'next/navigation';
import { getSeekerMeServer } from '@/lib/server-api/seeker';
import { SeekerProvider } from '@/context/seeker/SeekerContext';
import AdminAppShell from '@/components/layouts/AdminAppShell';
import type { AppUser } from '@/context/seeker/seeker-context-types';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const me = await getSeekerMeServer();
  if (!me) redirect('/login');
  if (!me.isAdmin) redirect('/');

  const initialUser: AppUser = { name: me.name, email: me.email, picture: me.picture, slug: me.slug };

  return (
    <SeekerProvider initialUser={initialUser}>
      <AdminAppShell>{children}</AdminAppShell>
    </SeekerProvider>
  );
}
