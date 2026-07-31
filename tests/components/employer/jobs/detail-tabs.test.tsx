// FILE: tests/components/employer/jobs/detail-tabs.test.tsx
// Tab order (Overview | Pipeline | Ranked | Settings), default tab, ?tab=
// deep-link stability, and the Settings low-pool badge.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { PostingDetail } from '@/components/employer/jobs/Detail';

let tabParam: string | null = null;
vi.mock('next/navigation', () => ({ useSearchParams: () => ({ get: () => tabParam }) }));
vi.mock('@/components/employer/jobs/PostingOverview', () => ({ default: () => <div>overview-body</div> }));
vi.mock('@/components/employer/jobs/DetailSettings', () => ({ default: () => <div>settings-body</div> }));
vi.mock('@/components/employer/jobs/PipelineTab', () => ({ default: () => <div>pipeline-body</div> }));
vi.mock('@/components/employer/jobs/RankedTab', () => ({ default: () => <div>ranked-body</div> }));

const getEmployerPosting = vi.fn();
vi.mock('@/api/employer-jobs-api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/employer-jobs-api')>();
  return { ...actual, getEmployerPosting: (...args: unknown[]) => getEmployerPosting(...args) };
});
const getInterviewTimeCount = vi.fn();
vi.mock('@/api/employer-interview-times-api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/employer-interview-times-api')>();
  return { ...actual, getInterviewTimeCount: (...args: unknown[]) => getInterviewTimeCount(...args) };
});

const POSTING = {
  id: 'p1', slug: 'be', title: 'Backend Engineer', description: 'x', descriptionPlain: 'x',
  location: 'Bengaluru', workplaceType: 'onsite', employmentType: 'full-time',
  salaryMin: null, salaryMax: null, salaryCurrency: 'INR', status: 'active',
  postedAt: null, createdAt: '2030-01-01T00:00:00Z', updatedAt: '2030-01-01T00:00:00Z',
};

beforeEach(() => {
  getEmployerPosting.mockReset(); getInterviewTimeCount.mockReset();
  getEmployerPosting.mockResolvedValue(POSTING);
  getInterviewTimeCount.mockResolvedValue({ availableCount: 5 });
  tabParam = null;
  cleanup();
});

describe('PostingDetail tabs', () => {
  it('orders tabs Overview | Pipeline | Ranked | Settings, defaulting to Overview', async () => {
    const { container } = render(<PostingDetail postingId="p1" />);
    await waitFor(() => expect(screen.getAllByRole('tab')).toHaveLength(4));
    const labels = screen.getAllByRole('tab').map((tab) => tab.textContent);
    expect(labels).toEqual(['Overview', 'Pipeline', 'Ranked', 'Settings']);
    expect(screen.getByText('overview-body')).toBeTruthy();
    // Full-width fix: the page container allows 1536px — well past 1000px on a
    // 1400px viewport (the old 'lg' cap was 1024px).
    const pageContainer = container.firstElementChild as HTMLElement;
    expect(pageContainer.style.maxWidth).toBe('1536px');
  });

  it('?tab=ranked still lands on the Ranked tab (deep links stay stable)', async () => {
    tabParam = 'ranked';
    render(<PostingDetail postingId="p1" />);
    await waitFor(() => expect(screen.getByText('ranked-body')).toBeTruthy());
  });

  it('shows a "0" badge on Settings when the pool is empty, none at 2+', async () => {
    getInterviewTimeCount.mockResolvedValue({ availableCount: 0 });
    render(<PostingDetail postingId="p1" />);
    await waitFor(() => expect(screen.getAllByRole('tab')).toHaveLength(4));
    await waitFor(() => expect(screen.getAllByRole('tab')[3].textContent).toBe('Settings0'));
    cleanup();
    getInterviewTimeCount.mockResolvedValue({ availableCount: 3 });
    render(<PostingDetail postingId="p1" />);
    await waitFor(() => expect(screen.getAllByRole('tab')).toHaveLength(4));
    expect(screen.getAllByRole('tab')[3].textContent).toBe('Settings');
  });

  it('shows an amber "1" badge at one remaining time', async () => {
    getInterviewTimeCount.mockResolvedValue({ availableCount: 1 });
    render(<PostingDetail postingId="p1" />);
    await waitFor(() => expect(screen.getAllByRole('tab')).toHaveLength(4));
    await waitFor(() => expect(screen.getAllByRole('tab')[3].textContent).toBe('Settings1'));
  });
});
