// FILE: tests/components/employer/jobs/ScheduleInterviewModal.test.tsx
// Validation, timezone discipline and failure handling for the schedule modal.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ScheduleInterviewModal from '@/components/employer/jobs/ScheduleInterviewModal';
import { EmployerInterviewsApiError } from '@/api/employer-interviews-api';
import { utcIsoToIstLocal } from '@/utils/ist-datetime';

const proposeInterview = vi.fn();
vi.mock('@/api/employer-interviews-api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/employer-interviews-api')>();
  return {
    ...actual,
    proposeInterview: (...args: unknown[]) => proposeInterview(...args),
    rescheduleInterview: vi.fn(),
  };
});

const istFuture = (hoursAhead: number) =>
  utcIsoToIstLocal(new Date(Date.now() + hoursAhead * 60 * 60 * 1000).toISOString());

function renderModal() {
  return render(
    <ScheduleInterviewModal
      open
      applicationId="app-1"
      candidateFirstName="Asha"
      onClose={() => {}}
      onSuccess={() => {}}
      onViewExisting={() => {}}
    />,
  );
}

function submitButton(): HTMLButtonElement {
  return screen.getByText('Send invitation').closest('button') as HTMLButtonElement;
}

function timeInputs(): HTMLInputElement[] {
  return [screen.getByLabelText('Option 1'), screen.getByLabelText('Option 2')] as HTMLInputElement[];
}

function fillValidForm(): void {
  fireEvent.change(screen.getByLabelText(/Meeting link/), { target: { value: 'https://meet.google.com/abc' } });
  const [first, second] = timeInputs();
  fireEvent.change(first, { target: { value: istFuture(24) } });
  fireEvent.change(second, { target: { value: istFuture(48) } });
}

beforeEach(() => { proposeInterview.mockReset(); });

describe('ScheduleInterviewModal', () => {
  it('cannot submit with only one time entered', () => {
    renderModal();
    fireEvent.change(screen.getByLabelText(/Meeting link/), { target: { value: 'https://meet.google.com/abc' } });
    fireEvent.change(timeInputs()[0], { target: { value: istFuture(24) } });
    expect(submitButton().disabled).toBe(true);
  });

  it('cannot submit with two identical times, and says so inline', () => {
    renderModal();
    fillValidForm();
    fireEvent.change(timeInputs()[1], { target: { value: istFuture(24) } });
    expect(submitButton().disabled).toBe(true);
    expect(screen.getByText('This time is the same as another option.')).toBeTruthy();
  });

  it('rejects a past time inline', () => {
    renderModal();
    fireEvent.change(timeInputs()[0], { target: { value: '2020-01-01T10:00' } });
    expect(screen.getByText('This time is in the past.')).toBeTruthy();
    expect(submitButton().disabled).toBe(true);
  });

  it('video mode rejects a bare non-URL string', () => {
    renderModal();
    fillValidForm();
    fireEvent.change(screen.getByLabelText(/Meeting link/), { target: { value: 'zoom room 4' } });
    expect(screen.getByText('Enter a full link starting with http:// or https://.')).toBeTruthy();
    expect(submitButton().disabled).toBe(true);
  });

  it('switching type from video to in_person clears the meeting link', () => {
    renderModal();
    fireEvent.change(screen.getByLabelText(/Meeting link/), { target: { value: 'https://meet.google.com/abc' } });
    fireEvent.click(screen.getByLabelText('In person'));
    fireEvent.click(screen.getByLabelText('Video call'));
    expect((screen.getByLabelText(/Meeting link/) as HTMLInputElement).value).toBe('');
  });

  it('sends IST-converted UTC slots, never the raw input value', async () => {
    proposeInterview.mockResolvedValue({ id: 'i1' });
    renderModal();
    fillValidForm();
    fireEvent.change(timeInputs()[0], { target: { value: '2030-08-10T15:00' } });
    fireEvent.click(submitButton());
    await waitFor(() => expect(proposeInterview).toHaveBeenCalled());
    const input = proposeInterview.mock.calls[0][1] as { proposedSlots: { startAtUtc: string }[]; timezoneId: string };
    expect(input.proposedSlots[0].startAtUtc).toBe('2030-08-10T09:30:00.000Z');
    expect(input.timezoneId).toBe('Asia/Kolkata');
  });

  it('409 INTERVIEW_ALREADY_ACTIVE keeps the modal open and shows the warning', async () => {
    proposeInterview.mockRejectedValue(new EmployerInterviewsApiError(409, 'INTERVIEW_ALREADY_ACTIVE', 'active'));
    renderModal();
    fillValidForm();
    fireEvent.click(submitButton());
    await waitFor(() => expect(screen.getByText('An interview is already active for this applicant.')).toBeTruthy());
    expect(screen.getByText('Close and view it')).toBeTruthy();
    expect(screen.getByLabelText('Option 1')).toBeTruthy(); // still open
  });

  it('a network failure keeps every entered time in the form', async () => {
    proposeInterview.mockRejectedValue(new Error('network down'));
    renderModal();
    fillValidForm();
    const enteredFirst = (timeInputs()[0]).value;
    const enteredSecond = (timeInputs()[1]).value;
    fireEvent.click(submitButton());
    await waitFor(() => expect(screen.getByText(/Something went wrong/)).toBeTruthy());
    expect((timeInputs()[0]).value).toBe(enteredFirst);
    expect((timeInputs()[1]).value).toBe(enteredSecond);
    expect((screen.getByLabelText(/Meeting link/) as HTMLInputElement).value).toBe('https://meet.google.com/abc');
  });
});
