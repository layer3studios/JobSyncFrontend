// FILE: tests/components/employer/jobs/interview-scheduling-settings.test.tsx
// The overhauled Settings workspace: day-grouped times, cancelled-hidden
// toggle, summary bar, chip-grid Added semantics, one-click date jump, and the
// full-width two-column layout. Also carries the DetailSettings/PostingOverview
// content-boundary tests.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import InterviewSchedulingSettings from '@/components/employer/jobs/InterviewSchedulingSettings';
import DetailSettings from '@/components/employer/jobs/DetailSettings';
import PostingOverview from '@/components/employer/jobs/PostingOverview';
import { ToastProvider } from '@/components/ui/Toast';
import { istLocalToUtcIso, utcIsoToIstLocal } from '@/utils/ist-datetime';
import type { Posting } from '@/types/employer-jobs';
import type { InterviewTime } from '@/types/employer-interviews';

vi.mock('@/context/employer/EmployerContext', () => ({
  useEmployer: () => ({ company: { slug: 'acme' }, viewerRole: 'member' }),
}));

const updateInterviewDefaults = vi.fn();
const listInterviewTimes = vi.fn();
const addInterviewTimes = vi.fn();
const removeInterviewTime = vi.fn();
vi.mock('@/api/employer-interview-times-api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/employer-interview-times-api')>();
  return {
    ...actual,
    updateInterviewDefaults: (...args: unknown[]) => updateInterviewDefaults(...args),
    listInterviewTimes: (...args: unknown[]) => listInterviewTimes(...args),
    addInterviewTimes: (...args: unknown[]) => addInterviewTimes(...args),
    removeInterviewTime: (...args: unknown[]) => removeInterviewTime(...args),
  };
});

const DEFAULTS = {
  meetingUrl: 'https://meet.acme.in/x', durationMinutes: 45,
  mode: 'video' as const, locationText: null, timezoneId: 'Asia/Kolkata',
};

function posting(overrides: Partial<Posting> = {}): Posting {
  return {
    id: 'p1', slug: 'be', title: 'Backend Engineer', description: 'x', descriptionPlain: 'x',
    location: 'Bengaluru', workplaceType: 'onsite', employmentType: 'full-time',
    salaryMin: null, salaryMax: null, salaryCurrency: 'INR', status: 'active',
    postedAt: null, createdAt: '2030-01-01T00:00:00Z', updatedAt: '2030-01-01T00:00:00Z',
    interviewDefaults: DEFAULTS,
    ...overrides,
  };
}

function time(id: string, startAtUtc: string, status: InterviewTime['status'] = 'available'): InterviewTime {
  return {
    id, startAtUtc, durationMinutes: 45, timezoneId: 'Asia/Kolkata', status,
    mode: 'video', meetingUrl: null, locationText: null, bookedByApplicationId: null, bookedAt: null,
  };
}

const tomorrow = () => utcIsoToIstLocal(new Date(Date.now() + 86400000).toISOString()).slice(0, 10);

function renderSettings(postingOverrides: Partial<Posting> = {}) {
  return render(
    <ToastProvider>
      <InterviewSchedulingSettings posting={posting(postingOverrides)} />
    </ToastProvider>,
  );
}

beforeEach(() => {
  updateInterviewDefaults.mockReset(); listInterviewTimes.mockReset();
  addInterviewTimes.mockReset(); removeInterviewTime.mockReset();
  listInterviewTimes.mockResolvedValue([]);
  cleanup();
});

describe('InterviewSchedulingSettings', () => {
  it('cancelled times are hidden by default; "Show N cancelled" reveals them', async () => {
    listInterviewTimes.mockResolvedValue([
      time('a', '2030-08-02T04:00:00.000Z'),
      time('gone', '2030-08-02T06:00:00.000Z', 'cancelled'),
    ]);
    renderSettings();
    await waitFor(() => expect(screen.getByText('Fri, 2 August 2030')).toBeTruthy());
    expect(screen.queryByText('cancelled', { selector: 'span' })).toBeNull();
    fireEvent.click(screen.getByText('Show 1 cancelled'));
    expect(screen.getByText('cancelled', { selector: 'span' })).toBeTruthy();
    fireEvent.click(screen.getByText('Hide cancelled'));
    expect(screen.queryByText('cancelled', { selector: 'span' })).toBeNull();
  });

  it('the summary bar shows correct counts', async () => {
    listInterviewTimes.mockResolvedValue([
      time('a', '2030-08-02T04:00:00.000Z'),
      time('b', '2030-08-02T05:00:00.000Z', 'booked'),
      time('c', '2030-08-04T04:00:00.000Z'),
      time('d', '2030-08-04T06:00:00.000Z', 'cancelled'),
    ]);
    renderSettings();
    await waitFor(() => expect(
      screen.getByText('4 times across 2 days · 2 available · 1 booked · 1 cancelled'),
    ).toBeTruthy());
  });

  it('chip grid marks available/booked as Added but leaves cancelled selectable (Bug 1)', async () => {
    const day = tomorrow();
    listInterviewTimes.mockResolvedValue([
      time('avail', istLocalToUtcIso(`${day}T09:30`) as string),
      time('booked', istLocalToUtcIso(`${day}T11:00`) as string, 'booked'),
      time('gone', istLocalToUtcIso(`${day}T12:30`) as string, 'cancelled'),
    ]);
    renderSettings();
    await waitFor(() => expect(screen.getByText('9:30 AM · Added')).toBeTruthy());
    expect((screen.getByText('9:30 AM · Added').closest('button') as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByText('11:00 AM · Added').closest('button') as HTMLButtonElement).disabled).toBe(true);
    const cancelledChip = screen.getByText('12:30 PM').closest('button') as HTMLButtonElement;
    expect(cancelledChip.disabled).toBe(false);
    fireEvent.click(cancelledChip);
    expect(screen.getByText('12:30 PM ✓')).toBeTruthy();
  });

  it('"+ Add more times to this date" points the date picker at that date', async () => {
    listInterviewTimes.mockResolvedValue([time('a', '2030-08-02T04:00:00.000Z')]);
    renderSettings();
    await waitFor(() => expect(screen.getByText('+ Add more times to this date')).toBeTruthy());
    fireEvent.click(screen.getByText('+ Add more times to this date'));
    expect((screen.getByLabelText('Pick a date') as HTMLInputElement).value).toBe('2030-08-02');
    expect(screen.getByText('1 time already on this date')).toBeTruthy();
  });

  it('selecting chips and Add all posts the UTC timestamps', async () => {
    addInterviewTimes.mockResolvedValue({ insertedCount: 2 });
    renderSettings();
    await waitFor(() => expect(screen.getByText('9:30 AM')).toBeTruthy());
    const day = (screen.getByLabelText('Pick a date') as HTMLInputElement).value;
    fireEvent.click(screen.getByText('9:30 AM'));
    fireEvent.click(screen.getByText('10:15 AM'));
    expect(screen.getByText('2 times selected across 1 day')).toBeTruthy();
    fireEvent.click(screen.getByText('Add all'));
    await waitFor(() => expect(addInterviewTimes).toHaveBeenCalledTimes(1));
    const [, sent] = addInterviewTimes.mock.calls[0] as [string, { startAtUtc: string }[]];
    expect(sent.map((entry) => entry.startAtUtc).sort()).toEqual([
      istLocalToUtcIso(`${day}T09:30`), istLocalToUtcIso(`${day}T10:15`),
    ].sort());
  });

  it('renders full width: no max-width narrower than the container', async () => {
    const { container } = renderSettings();
    await waitFor(() => expect(screen.getByText('Interview scheduling')).toBeTruthy());
    const card = container.firstElementChild as HTMLElement;
    expect(card.style.width).toBe('100%');
    expect(card.style.maxWidth).toBe('');
  });

  it('empty state prompts toward the date picker', async () => {
    renderSettings();
    await waitFor(() => expect(screen.getByText(/No interview times yet/)).toBeTruthy());
  });
});

describe('tab content boundaries (carried over)', () => {
  it('Settings contains Interview scheduling and NOT the job description', async () => {
    render(
      <ToastProvider>
        <DetailSettings posting={posting({ description: 'JD-BODY-TEXT' })} />
      </ToastProvider>,
    );
    await waitFor(() => expect(screen.getByText('Interview scheduling')).toBeTruthy());
    expect(screen.queryByText('JD-BODY-TEXT')).toBeNull();
  });

  it('Overview shows the description, status badge, and edit icon', () => {
    render(
      <ToastProvider>
        <PostingOverview posting={posting({ description: 'JD-BODY-TEXT' })} onReload={async () => {}} />
      </ToastProvider>,
    );
    expect(screen.getByText('JD-BODY-TEXT')).toBeTruthy();
    expect(screen.getByText('active')).toBeTruthy();
    expect(screen.getByLabelText('Edit posting')).toBeTruthy();
  });
});
