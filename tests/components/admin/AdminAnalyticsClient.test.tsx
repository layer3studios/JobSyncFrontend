import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { ReactNode } from 'react';
import type { AdminAnalyticsData } from '@/types/admin-analytics';

const push = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
  usePathname: () => '/admin/analytics',
}));

// Stub recharts so charts render in happy-dom without real dimensions. Components are
// defined INSIDE the factory — vi.mock is hoisted above module-level consts.
vi.mock('recharts', () => {
  const Pass = ({ children }: { children?: ReactNode }) => <div>{children}</div>;
  const Nil = () => null;
  return {
    ResponsiveContainer: Pass, LineChart: Pass, Line: Nil, Tooltip: Nil, XAxis: Nil, YAxis: Nil,
    BarChart: Pass, Bar: Pass, Cell: Nil, PieChart: Pass, Pie: Pass, Legend: Nil,
  };
});

import AdminAnalyticsClient from '@/app/(admin)/admin/(app)/analytics/AdminAnalyticsClient';
import EmptyStateNotice from '@/app/(admin)/admin/(app)/analytics/parts/EmptyStateNotice';

const meta = { cachedAt: '2026-07-20T00:00:00.000Z', since: '7d' };
const DATA: AdminAnalyticsData = {
  volume: { ...meta, visitorsTotal: 123, pageviewsTotal: 456, visitorsByDay: [{ date: 'd', count: 1 }], pageviewsByDay: [] },
  seeker: { ...meta, signups: 7, logins: 3, jobsListViews: 20, jobDetailViews: 12, applyStarted: 5, applySubmitted: 2, applySuccessViewed: 1, funnel: [{ stage: 'jobs_list_viewed', count: 20 }] },
  employer: { ...meta, signups: 4, logins: 6, onboardingStarted: 3, onboardingCompleted: 2, postingsCreated: 8, postingsPublished: 5, funnel: [{ stage: 'employer_signup_completed', count: 4 }] },
  engagement: { ...meta, applicantsViewed: 30, applicantsMovedStage: 12, applicantsArchived: 4, notesAdded: 9 },
  team: { ...meta, invitesSent: 10, invitesAccepted: 6 },
  traffic: { ...meta, byReferrer: [{ bucket: 'google', count: 5 }], byDevice: [{ type: 'Desktop', count: 8 }] },
};

describe('AdminAnalyticsClient', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders KPI tiles from the data', () => {
    render(<AdminAnalyticsClient data={DATA} since="7d" />);
    expect(screen.getByText('Visitors')).toBeTruthy();
    expect(screen.getByText('123')).toBeTruthy();
    expect(screen.getByText('456')).toBeTruthy();
    // Team accepted-rate hint (6/10 = 60%).
    expect(screen.getByText('60% accepted')).toBeTruthy();
  });

  it('time range change pushes a new ?since to the URL', () => {
    render(<AdminAnalyticsClient data={DATA} since="7d" />);
    fireEvent.click(screen.getByText('24h'));
    expect(push).toHaveBeenCalledWith('/admin/analytics?since=24h');
  });

  it('does not push when the active range is clicked again', () => {
    render(<AdminAnalyticsClient data={DATA} since="7d" />);
    fireEvent.click(screen.getByText('7 days'));
    expect(push).not.toHaveBeenCalled();
  });
});

describe('EmptyStateNotice (ANALYTICS_DISABLED state)', () => {
  it('renders the not-configured message', () => {
    render(<EmptyStateNotice title="Analytics not configured" body="Set POSTHOG_PERSONAL_API_KEY." />);
    expect(screen.getByText('Analytics not configured')).toBeTruthy();
    expect(screen.getByText('Set POSTHOG_PERSONAL_API_KEY.')).toBeTruthy();
  });
});
