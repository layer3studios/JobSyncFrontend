'use client';
// FILE: src/app/(admin)/admin/(app)/analytics/AdminAnalyticsClient.tsx
// Client dashboard. SSR seeds initialData for initialSince (fast first paint); filter
// clicks fetch client-side and memoize per range in memory, so revisiting a range is
// instant (D1/D5). Failures are bundle-level, surface inline with Retry (D2/D7).
import { useCallback, useState } from 'react';
import type { ReactNode } from 'react';
import type { AdminAnalyticsData, SinceRange } from '@/types/admin-analytics';
import { fetchAllAnalyticsBundles, AdminAnalyticsApiError } from '@/api/admin-analytics-api';
import KpiTile from './parts/KpiTile';
import SparklineCard from './parts/SparklineCard';
import FunnelBarChart from './parts/FunnelBarChart';
import PieDistribution from './parts/PieDistribution';
import SectionHeader from './parts/SectionHeader';
import TimeRangeSelector from './parts/TimeRangeSelector';
import EmptyStateNotice from './parts/EmptyStateNotice';

function Grid({ children, min = 200 }: { children: ReactNode; min?: number }) {
  return (
    <div style={{ display: 'grid', gap: 12, gridTemplateColumns: `repeat(auto-fit, minmax(${min}px, 1fr))` }}>
      {children}
    </div>
  );
}

function acceptRate(sent: number, accepted: number): string {
  return sent <= 0 ? '—' : `${Math.round((accepted / sent) * 100)}% accepted`;
}

// Map a bundle-level error to a user-facing message + whether a Retry makes sense.
function describeError(error: AdminAnalyticsApiError): { title: string; body: string; canRetry: boolean } {
  if (error.code === 'ANALYTICS_DISABLED') {
    return { title: 'Analytics not configured', body: 'Set POSTHOG_PERSONAL_API_KEY on the backend and reload — no data can be fetched until then.', canRetry: false };
  }
  if (error.status === 401 || error.status === 403) {
    return { title: 'Session expired', body: 'Reload the page to sign in again.', canRetry: false };
  }
  return { title: "Couldn't load analytics", body: error.message || 'Something went wrong fetching this range.', canRetry: true };
}

// Full-page error surface for a range with no cached data — notice + optional Retry.
function ErrorSurface({ error, onRetry }: { error: AdminAnalyticsApiError; onRetry: () => void }) {
  const { title, body, canRetry } = describeError(error);
  return (
    <>
      <EmptyStateNotice title={title} body={body} />
      {canRetry && (
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <button type="button" onClick={onRetry} style={{
            padding: '8px 18px', borderRadius: 8, border: '1px solid var(--border)',
            background: 'var(--surface)', color: 'var(--ink)', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem',
          }}>Retry</button>
        </div>
      )}
    </>
  );
}

export default function AdminAnalyticsClient({
  initialData, initialSince,
}: {
  initialData: AdminAnalyticsData;
  initialSince: SinceRange;
}) {
  const [currentSince, setCurrentSince] = useState<SinceRange>(initialSince);
  const [cache, setCache] = useState<Map<SinceRange, AdminAnalyticsData>>(() => new Map([[initialSince, initialData]]));
  const [loadingRanges, setLoadingRanges] = useState<Set<SinceRange>>(() => new Set());
  const [errorByRange, setErrorByRange] = useState<Map<SinceRange, AdminAnalyticsApiError>>(() => new Map());
  const [dismissed, setDismissed] = useState<Set<SinceRange>>(() => new Set());

  const load = useCallback(async (next: SinceRange) => {
    setLoadingRanges((prev) => new Set(prev).add(next));
    try {
      const data = await fetchAllAnalyticsBundles(next);
      setCache((prev) => new Map(prev).set(next, data));
      setErrorByRange((prev) => { const m = new Map(prev); m.delete(next); return m; });
    } catch (error) {
      const apiError = error instanceof AdminAnalyticsApiError
        ? error
        : new AdminAnalyticsApiError(0, null, error instanceof Error ? error.message : 'Failed to load analytics.');
      setErrorByRange((prev) => new Map(prev).set(next, apiError));
    } finally {
      setLoadingRanges((prev) => { const s = new Set(prev); s.delete(next); return s; });
    }
  }, []);

  const onSelect = (next: SinceRange) => {
    if (next === currentSince) return;
    setCurrentSince(next);
    if (!cache.has(next)) void load(next);
  };

  const retry = () => { setDismissed((prev) => { const s = new Set(prev); s.delete(currentSince); return s; }); void load(currentSince); };
  const dismissBanner = () => setDismissed((prev) => new Set(prev).add(currentSince));

  const data = cache.get(currentSince);
  const currentError = errorByRange.get(currentSince);
  const isChanging = loadingRanges.has(currentSince);

  return (
    <div style={{ maxWidth: 1120, margin: '0 auto', padding: '24px 24px 60px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--ink)', margin: 0 }}>Analytics</h1>
        <TimeRangeSelector value={currentSince} onSelect={onSelect} isChanging={isChanging} />
      </div>

      {/* Refresh failed but a cached view for this range still exists — keep showing it. */}
      {data && currentError && !dismissed.has(currentSince) && (
        <div role="status" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 16,
          padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--paper-2)',
          color: 'var(--ink-muted)', fontSize: '0.85rem',
        }}>
          <span>Refresh failed — showing cached data. Try again.</span>
          <button type="button" onClick={dismissBanner} aria-label="Dismiss" style={{
            border: 'none', background: 'transparent', color: 'var(--ink-muted)', cursor: 'pointer', fontWeight: 600,
          }}>Dismiss</button>
        </div>
      )}

      {!data ? (
        currentError ? (
          <ErrorSurface error={currentError} onRetry={retry} />
        ) : (
          <p style={{ textAlign: 'center', marginTop: 60, color: 'var(--ink-muted)' }}>Loading analytics…</p>
        )
      ) : (
        <Sections data={data} />
      )}
    </div>
  );
}

function Sections({ data }: { data: AdminAnalyticsData }) {
  const { volume, seeker, employer, engagement, team, traffic } = data;
  return (
    <>
      {/* A — Volume */}
      <SectionHeader title="Volume" cachedAt={volume.cachedAt} />
      <Grid>
        <KpiTile label="Visitors" value={volume.visitorsTotal} />
        <KpiTile label="Pageviews" value={volume.pageviewsTotal} />
        <SparklineCard title="Visitors / day" data={volume.visitorsByDay} />
        <SparklineCard title="Pageviews / day" data={volume.pageviewsByDay} />
      </Grid>

      {/* B — Seeker funnel */}
      <SectionHeader title="Seeker funnel" cachedAt={seeker.cachedAt} />
      <Grid min={150}>
        <KpiTile label="Signups" value={seeker.signups} />
        <KpiTile label="Logins" value={seeker.logins} />
        <KpiTile label="Jobs list views" value={seeker.jobsListViews} />
        <KpiTile label="Job detail views" value={seeker.jobDetailViews} />
        <KpiTile label="Apply started" value={seeker.applyStarted} />
        <KpiTile label="Apply submitted" value={seeker.applySubmitted} />
        <KpiTile label="Apply success" value={seeker.applySuccessViewed} />
      </Grid>
      <div style={{ marginTop: 12 }}>
        <FunnelBarChart title="Seeker conversion" stages={seeker.funnel} />
      </div>

      {/* C — Employer funnel */}
      <SectionHeader title="Employer funnel" cachedAt={employer.cachedAt} />
      <Grid min={150}>
        <KpiTile label="Signups" value={employer.signups} />
        <KpiTile label="Logins" value={employer.logins} />
        <KpiTile label="Onboarding started" value={employer.onboardingStarted} />
        <KpiTile label="Onboarding done" value={employer.onboardingCompleted} />
        <KpiTile label="Postings created" value={employer.postingsCreated} />
        <KpiTile label="Postings published" value={employer.postingsPublished} />
      </Grid>
      <div style={{ marginTop: 12 }}>
        <FunnelBarChart title="Employer conversion" stages={employer.funnel} />
      </div>

      {/* D — Engagement */}
      <SectionHeader title="Employer engagement" cachedAt={engagement.cachedAt} />
      <Grid min={180}>
        <KpiTile label="Applicants viewed" value={engagement.applicantsViewed} />
        <KpiTile label="Stage moves" value={engagement.applicantsMovedStage} />
        <KpiTile label="Applicants archived" value={engagement.applicantsArchived} />
        <KpiTile label="Notes added" value={engagement.notesAdded} />
      </Grid>

      {/* E — Team */}
      <SectionHeader title="Team invites" cachedAt={team.cachedAt} />
      <Grid min={180}>
        <KpiTile label="Invites sent" value={team.invitesSent} />
        <KpiTile label="Invites accepted" value={team.invitesAccepted} hint={acceptRate(team.invitesSent, team.invitesAccepted)} />
      </Grid>

      {/* F — Traffic */}
      <SectionHeader title="Traffic sources" cachedAt={traffic.cachedAt} />
      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
        <PieDistribution title="By referrer" data={traffic.byReferrer.map((r) => ({ name: r.bucket, value: r.count }))} />
        <PieDistribution title="By device" data={traffic.byDevice.map((d) => ({ name: d.type, value: d.count }))} />
      </div>
    </>
  );
}
