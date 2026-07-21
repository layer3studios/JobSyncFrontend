// FILE: src/app/(admin)/admin/analytics/page.tsx
// Admin analytics dashboard (Server Component). Reads ?since, fetches all six bundles
// in parallel with the seeker cookie forwarded (isAdmin enforced by the backend and
// the (admin) layout), and hands normalized data to the client. Renders a single clear
// state — never half a dashboard — when analytics is unconfigured or access is denied.
import type { Metadata } from 'next';
import { serverFetch, ServerFetchError } from '@/lib/server-fetch';
import {
  normalizeVolume, normalizeSeeker, normalizeEmployer,
  normalizeEngagement, normalizeTeam, normalizeTraffic,
} from '@/api/admin-analytics-api';
import type { AdminAnalyticsData, SinceRange } from '@/types/admin-analytics';
import AdminAnalyticsClient from './AdminAnalyticsClient';
import EmptyStateNotice from './parts/EmptyStateNotice';

export const metadata: Metadata = {
  title: 'Analytics · JobMesh Admin',
  robots: { index: false, follow: false },
};

const RANGES: SinceRange[] = ['24h', '7d', '30d'];
type Row = Record<string, unknown>;
const get = (path: string, since: string) => serverFetch<Row>(`/admin/analytics/${path}?since=${since}`);

function resolveSince(raw: string | string[] | undefined): SinceRange {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return RANGES.includes(value as SinceRange) ? (value as SinceRange) : '7d';
}

export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ since?: string | string[] }>;
}) {
  const since = resolveSince((await searchParams).since);

  let data: AdminAnalyticsData;
  try {
    const [volume, seeker, employer, engagement, team, traffic] = await Promise.all([
      get('volume', since), get('seeker', since), get('employer', since),
      get('engagement', since), get('team', since), get('traffic', since),
    ]);
    data = {
      volume: normalizeVolume(volume),
      seeker: normalizeSeeker(seeker),
      employer: normalizeEmployer(employer),
      engagement: normalizeEngagement(engagement),
      team: normalizeTeam(team),
      traffic: normalizeTraffic(traffic),
    };
  } catch (error) {
    if (error instanceof ServerFetchError && error.code === 'ANALYTICS_DISABLED') {
      return (
        <EmptyStateNotice
          title="Analytics not configured"
          body="The server is missing POSTHOG_PERSONAL_API_KEY. Set it in the backend environment (EC2) and reload — no data can be fetched until then."
        />
      );
    }
    if (error instanceof ServerFetchError && (error.status === 401 || error.status === 403)) {
      return <EmptyStateNotice title="Access denied" body="You need an admin account to view analytics." />;
    }
    throw error; // unexpected → error.tsx boundary
  }

  return <AdminAnalyticsClient data={data} since={since} />;
}
