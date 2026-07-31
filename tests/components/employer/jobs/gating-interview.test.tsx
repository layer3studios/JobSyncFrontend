// FILE: tests/components/employer/jobs/gating-interview.test.tsx
// Role gating for the Interview section, matching gating-review's pattern:
// an interviewer simply does not see actions they cannot take.
import { describe, it, expect, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import InterviewSection from '@/components/employer/jobs/InterviewSection';
import { ToastProvider } from '@/components/ui/Toast';
import type { Interview } from '@/types/employer-interviews';

let viewer: { viewerRole: string | null };
vi.mock('@/context/employer/EmployerContext', () => ({ useEmployer: () => viewer }));

let hookState: { interviews: Interview[]; activeInterview: Interview | null };
vi.mock('@/hooks/employer/useApplicantInterviews', () => ({
  useApplicantInterviews: () => ({
    interviews: hookState.interviews,
    loading: false,
    error: null,
    refetch: async () => {},
    activeInterview: hookState.activeInterview,
    hasActiveInterview: hookState.activeInterview !== null,
  }),
}));

const scheduledInterview = {
  id: 'i1', applicationId: 'a1', postingId: 'p1', contactId: 'c1', status: 'scheduled',
  proposedSlots: [{ startAtUtc: '2030-08-10T09:30:00.000Z', durationMinutes: 45 }],
  selectedSlotIndex: 0, startAtUtc: '2030-08-10T09:30:00.000Z', timezoneId: 'Asia/Kolkata',
  durationMinutes: 45, mode: 'video', meetingUrl: 'https://meet.google.com/abc', locationText: null,
  calendarSequence: 1, interviewerEmployerUserIds: [], createdByEmployerUserId: 'u1',
  bookingTokenExpiresAt: '2030-08-07T09:30:00.000Z', bookedAt: '2030-08-01T00:00:00.000Z',
  cancelledAt: null, cancelReason: null, createdAt: '2030-08-01T00:00:00.000Z',
} as Interview;

function renderSection() {
  return render(
    <ToastProvider>
      <InterviewSection applicationId="a1" candidateName="Asha Rao" />
    </ToastProvider>,
  );
}

describe('InterviewSection role gating', () => {
  it('interviewer sees no Schedule button; a member does', () => {
    viewer = { viewerRole: 'interviewer' };
    hookState = { interviews: [], activeInterview: null };
    renderSection();
    expect(screen.getByText('Interview')).toBeTruthy(); // section still renders
    expect(screen.queryByText('Schedule interview')).toBeNull();
    cleanup();
    viewer = { viewerRole: 'member' };
    renderSection();
    expect(screen.getByText('Schedule interview')).toBeTruthy();
  });

  it('interviewer sees no Reschedule or Cancel on an existing interview', () => {
    viewer = { viewerRole: 'interviewer' };
    hookState = { interviews: [scheduledInterview], activeInterview: scheduledInterview };
    renderSection();
    expect(screen.getByText('Confirmed')).toBeTruthy(); // card is visible
    expect(screen.queryByText('Reschedule')).toBeNull();
    expect(screen.queryByText('Cancel')).toBeNull();
  });

  it('member sees Reschedule and Cancel on an existing interview', () => {
    viewer = { viewerRole: 'member' };
    hookState = { interviews: [scheduledInterview], activeInterview: scheduledInterview };
    renderSection();
    expect(screen.getByText('Reschedule')).toBeTruthy();
    expect(screen.getByText('Cancel')).toBeTruthy();
  });
});
