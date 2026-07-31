// FILE: tests/components/employer/jobs/InterviewAvailabilitySection.test.tsx
// Settings-tab availability: defaults form gating, IST conversion on add,
// low-pool banner, and the booked-time badge/remove rules.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import InterviewAvailabilitySection from '@/components/employer/jobs/InterviewAvailabilitySection';
import { ToastProvider } from '@/components/ui/Toast';
import type { Posting } from '@/types/employer-jobs';
import type { InterviewTime } from '@/types/employer-interviews';

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

function time(overrides: Partial<InterviewTime> = {}): InterviewTime {
  return {
    id: 't1', startAtUtc: '2030-08-10T09:30:00.000Z', durationMinutes: 45,
    timezoneId: 'Asia/Kolkata', status: 'available', mode: 'video',
    meetingUrl: 'https://meet.acme.in/x', locationText: null,
    bookedByApplicationId: null, bookedAt: null,
    ...overrides,
  };
}

function renderSection(postingOverrides: Partial<Posting> = {}) {
  return render(
    <ToastProvider>
      <InterviewAvailabilitySection posting={posting(postingOverrides)} />
    </ToastProvider>,
  );
}

beforeEach(() => {
  updateInterviewDefaults.mockReset(); listInterviewTimes.mockReset();
  addInterviewTimes.mockReset(); removeInterviewTime.mockReset();
  listInterviewTimes.mockResolvedValue([]);
  cleanup();
});

describe('InterviewAvailabilitySection', () => {
  it('no defaults: shows the setup prompt and hides the times manager', () => {
    renderSection({ interviewDefaults: null });
    expect(screen.getByText(/Set up your interview details/)).toBeTruthy();
    expect(screen.queryByText('Available times')).toBeNull();
  });

  it('saving defaults unlocks the times manager', async () => {
    updateInterviewDefaults.mockResolvedValue(posting());
    renderSection({ interviewDefaults: null });
    fireEvent.change(screen.getByLabelText(/Meeting link/), { target: { value: 'https://meet.google.com/x' } });
    fireEvent.click(screen.getByText('Save interview details'));
    await waitFor(() => expect(screen.getByText('Available times')).toBeTruthy());
    expect(updateInterviewDefaults).toHaveBeenCalledWith('p1', expect.objectContaining({
      mode: 'video', meetingUrl: 'https://meet.google.com/x', timezoneId: 'Asia/Kolkata',
    }));
  });

  it('adding a time converts IST wall-clock to UTC before sending', async () => {
    addInterviewTimes.mockResolvedValue({ insertedCount: 1 });
    renderSection();
    await waitFor(() => expect(screen.getByText('Add times')).toBeTruthy());
    fireEvent.click(screen.getByText('Add times'));
    fireEvent.change(screen.getByLabelText('New time 1'), { target: { value: '2030-08-10T15:00' } });
    fireEvent.click(screen.getByText('Add'));
    await waitFor(() => expect(addInterviewTimes).toHaveBeenCalledWith('p1', [
      { startAtUtc: '2030-08-10T09:30:00.000Z' },
    ]));
  });

  it('a past time blocks Add with an inline message', async () => {
    renderSection();
    await waitFor(() => expect(screen.getByText('Add times')).toBeTruthy());
    fireEvent.click(screen.getByText('Add times'));
    fireEvent.change(screen.getByLabelText('New time 1'), { target: { value: '2020-01-01T10:00' } });
    expect(screen.getByText('Every time must be in the future.')).toBeTruthy();
    expect((screen.getByText('Add').closest('button') as HTMLButtonElement).disabled).toBe(true);
  });

  it('booked times show a badge and no remove button; available times are removable', async () => {
    listInterviewTimes.mockResolvedValue([
      time({ id: 'avail' }),
      time({ id: 'booked', startAtUtc: '2030-08-11T09:30:00.000Z', status: 'booked', bookedByApplicationId: 'a1' }),
    ]);
    renderSection();
    await waitFor(() => expect(screen.getByText('Booked')).toBeTruthy());
    expect(screen.getByLabelText(/Remove Sat 10 Aug/)).toBeTruthy();
    expect(screen.queryByLabelText(/Remove Sun 11 Aug/)).toBeNull();
  });

  it('shows the low-pool banner at 0 or 1 available time', async () => {
    listInterviewTimes.mockResolvedValue([time()]);
    renderSection();
    await waitFor(() => expect(screen.getByText(/1 interview time remaining/)).toBeTruthy());
  });
});
