// FILE: src/app/(admin)/admin/(app)/analytics/page.tsx
// Admin analytics dashboard (Server Component). Reads ?since, fetches all six bundles
// in parallel with the cookie jar forwarded. Admin identity is jm_admin_token, verified
// by require-admin-middleware; this file now sits under (admin)/admin/(app)/layout.tsx,
// so that guard redirects unauthed users FIRST — the API 401 catch below is only a
// belt-and-suspenders net for a session that expires mid-render. The 25s per-call
// timeout reflects PostHog Query API latency (its queue can hold a request up to 30s per
// PostHog docs). Renders a single clear state — never half a dashboard — when analytics
// is unconfigured or access is denied.
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
// PostHog Query API can queue up to 30s (R1); 25s sits under Nginx's 60s read timeout
// with buffer, but returns a fast-enough error when PostHog is genuinely down (D2).
const ANALYTICS_SSR_TIMEOUT_MS = 25_000;
// Backend envelope: { result: {...}, cachedAt, since }. Unwrap so normalizers see
// the fields at top-level. Mirrors the client-side unwrap in api/admin-analytics-api.ts
// so SSR and client paths hand the same shape to the normalizers.
const unwrap = (body: Row): Row => {
  const result = (body.result as Row | undefined) ?? body;
  return { ...result, cachedAt: body.cachedAt, since: body.since };
};

const get = async (path: string, since: string): Promise<Row> => {
  const body = await serverFetch<Row>(
    `/admin/analytics/${path}?since=${since}`,
    undefined,
    { timeoutMs: ANALYTICS_SSR_TIMEOUT_MS },
  );
  return unwrap(body);
};

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

  return <AdminAnalyticsClient initialData={data} initialSince={since} />;
}
