'use client';
// FILE: src/app/(admin)/admin/analytics/AdminAnalyticsClient.tsx
// Renders the six analytics sections from server-fetched data. Stateless beyond the
// time-range selector (which drives a URL change → server refetch). Each section
// header shows its own cachedAt so staleness is visible per bundle.
import type { ReactNode } from 'react';
import type { AdminAnalyticsData, SinceRange } from '@/types/admin-analytics';
import KpiTile from './parts/KpiTile';
import SparklineCard from './parts/SparklineCard';
import FunnelBarChart from './parts/FunnelBarChart';
import PieDistribution from './parts/PieDistribution';
import SectionHeader from './parts/SectionHeader';
import TimeRangeSelector from './parts/TimeRangeSelector';

function Grid({ children, min = 200 }: { children: ReactNode; min?: number }) {
  return (
    <div style={{ display: 'grid', gap: 12, gridTemplateColumns: `repeat(auto-fit, minmax(${min}px, 1fr))` }}>
      {children}
    </div>
  );
}

function acceptRate(sent: number, accepted: number): string {
  if (sent <= 0) return '—';
  return `${Math.round((accepted / sent) * 100)}% accepted`;
}

export default function AdminAnalyticsClient({ data, since }: { data: AdminAnalyticsData; since: SinceRange }) {
  const { volume, seeker, employer, engagement, team, traffic } = data;

  return (
    <div style={{ maxWidth: 1120, margin: '0 auto', padding: '24px 24px 60px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--ink)', margin: 0 }}>Analytics</h1>
        <TimeRangeSelector value={since} />
      </div>

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
    </div>
  );
}
