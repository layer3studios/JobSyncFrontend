// FILE: tests/components/employer/jobs/pool-reschedule.test.tsx
// Pool-aware reschedule: pool interviews get the cancel+resend confirm dialog,
// per-candidate interviews keep the manual-slots modal.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import InterviewSection from '@/components/employer/jobs/InterviewSection';
import { ToastProvider } from '@/components/ui/Toast';
import type { Interview } from '@/types/employer-interviews';

vi.mock('@/context/employer/EmployerContext', () => ({ useEmployer: () => ({ viewerRole: 'member' }) }));
vi.mock('next/navigation', () => ({ useParams: () => ({ postingId: 'p1' }) }));
vi.mock('@/components/employer/jobs/useSchedulingPool', () => ({
  useSchedulingPool: () => ({ hasDefaults: true, availableCount: 3, refetchPool: async () => {} }),
}));

let hookState: { interviews: Interview[]; activeInterview: Interview | null };
vi.mock('@/hooks/employer/useApplicantInterviews', () => ({
  useApplicantInterviews: () => ({
    interviews: hookState.interviews, loading: false, error: null,
    refetch: async () => {}, activeInterview: hookState.activeInterview,
    hasActiveInterview: hookState.activeInterview !== null,
  }),
}));

const calls: string[] = [];
const cancelInterview = vi.fn();
const sendPoolSchedulingLink = vi.fn();
vi.mock('@/api/employer-interviews-api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/employer-interviews-api')>();
  return { ...actual, cancelInterview: (...args: unknown[]) => { calls.push('cancel'); return cancelInterview(...args); } };
});
vi.mock('@/api/employer-interview-times-api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/employer-interview-times-api')>();
  const { EmployerInterviewTimesApiError } = actual;
  return {
    ...actual,
    EmployerInterviewTimesApiError,
    sendPoolSchedulingLink: (...args: unknown[]) => { calls.push('send'); return sendPoolSchedulingLink(...args); },
  };
});
import { EmployerInterviewTimesApiError } from '@/api/employer-interview-times-api';

function interview(overrides: Partial<Interview> = {}): Interview {
  return {
    id: 'i1', applicationId: 'a1', postingId: 'p1', contactId: 'c1', status: 'scheduled',
    proposedSlots: [], selectedSlotIndex: 0, startAtUtc: '2030-08-10T09:30:00.000Z',
    timezoneId: 'Asia/Kolkata', durationMinutes: 45, mode: 'video',
    meetingUrl: 'https://meet.acme.in/x', locationText: null, calendarSequence: 1,
    interviewerEmployerUserIds: [], createdByEmployerUserId: 'u1',
    bookingTokenExpiresAt: '2030-08-07T09:30:00.000Z', bookedAt: '2030-08-01T00:00:00.000Z',
    cancelledAt: null, cancelReason: null, createdAt: '2030-08-01T00:00:00.000Z',
    source: 'pool',
    ...overrides,
  };
}

function renderSection(active: Interview) {
  hookState = { interviews: [active], activeInterview: active };
  return render(
    <ToastProvider>
      <InterviewSection applicationId="a1" candidateName="Asha Rao" />
    </ToastProvider>,
  );
}

beforeEach(() => {
  cancelInterview.mockReset(); sendPoolSchedulingLink.mockReset(); calls.length = 0;
  cancelInterview.mockResolvedValue(interview({ status: 'cancelled' }));
  sendPoolSchedulingLink.mockResolvedValue(interview({ id: 'i2', status: 'proposed' }));
  cleanup();
});

describe('pool-aware reschedule', () => {
  it('pool interview Reschedule opens the PoolRescheduleDialog, not the schedule modal', () => {
    renderSection(interview({ source: 'pool', proposedSlots: [] }));
    fireEvent.click(screen.getByText('Reschedule'));
    expect(screen.getByText('Reschedule this interview?')).toBeTruthy();
    expect(screen.getByText(/released back to the pool/)).toBeTruthy();
    expect(screen.queryByText('Send new times')).toBeNull(); // manual modal absent
  });

  it('per-candidate interview Reschedule opens the ScheduleInterviewModal (no regression)', () => {
    renderSection(interview({
      source: null,
      proposedSlots: [
        { startAtUtc: '2030-08-10T09:30:00.000Z', durationMinutes: 45 },
        { startAtUtc: '2030-08-11T09:30:00.000Z', durationMinutes: 45 },
      ],
    }));
    fireEvent.click(screen.getByText('Reschedule'));
    expect(screen.getByText('Send new times')).toBeTruthy(); // manual modal
    expect(screen.queryByText(/released back to the pool/)).toBeNull();
  });

  it('confirming pool reschedule calls cancel THEN send-scheduling-link, and toasts Rescheduled', async () => {
    renderSection(interview());
    fireEvent.click(screen.getByText('Reschedule'));
    fireEvent.click(screen.getAllByText('Reschedule').find((el) => el.closest('footer'))!);
    await waitFor(() => expect(calls).toEqual(['cancel', 'send']));
    expect(cancelInterview).toHaveBeenCalledWith('i1', { cancelReason: 'Rescheduled to new pool link' });
    expect(sendPoolSchedulingLink).toHaveBeenCalledWith('a1');
    await waitFor(() => expect(screen.getByText('Rescheduled — new scheduling link sent to Asha.')).toBeTruthy());
    expect(screen.queryByText(/^Interview cancelled/)).toBeNull();
  });

  it('POOL_EMPTY after the cancel shows the add-more-times warning toast', async () => {
    sendPoolSchedulingLink.mockRejectedValue(new EmployerInterviewTimesApiError(400, 'POOL_EMPTY', 'empty'));
    renderSection(interview());
    fireEvent.click(screen.getByText('Reschedule'));
    fireEvent.click(screen.getAllByText('Reschedule').find((el) => el.closest('footer'))!);
    await waitFor(() => expect(screen.getByText(
      'Interview cancelled but no available times to reschedule. Add more times on the posting settings.',
    )).toBeTruthy());
    expect(calls).toEqual(['cancel', 'send']);
  });

  it('a failed cancel keeps the dialog open with an inline error', async () => {
    cancelInterview.mockRejectedValue(new Error('network'));
    renderSection(interview());
    fireEvent.click(screen.getByText('Reschedule'));
    fireEvent.click(screen.getAllByText('Reschedule').find((el) => el.closest('footer'))!);
    await waitFor(() => expect(screen.getByText('Could not reschedule. Try again.')).toBeTruthy());
    expect(screen.getByText('Reschedule this interview?')).toBeTruthy(); // still open
    expect(calls).toEqual(['cancel']);
  });
});
