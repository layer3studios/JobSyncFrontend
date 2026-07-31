'use client';
// FILE: src/components/employer/jobs/PoolRescheduleDialog.tsx
// Reschedule for POOL interviews: no manual time entry — cancel the current
// interview (its time recycles back to the pool) and immediately send a fresh
// scheduling link. Two sequential API calls. Matches CancelInterviewDialog's
// confirm pattern; the dismiss control never reads "Cancel".

import { useState } from 'react';
import { Modal, Button, Stack, Alert, useToast } from '@/components/ui';
import { cancelInterview, EmployerInterviewsApiError } from '@/api/employer-interviews-api';
import { sendPoolSchedulingLink, EmployerInterviewTimesApiError } from '@/api/employer-interview-times-api';

const RESCHEDULE_CANCEL_REASON = 'Rescheduled to new pool link';

export default function PoolRescheduleDialog({
  open, interviewId, applicationId, candidateFirstName, onKeep, onDone,
}: {
  open: boolean;
  interviewId: string;
  applicationId: string;
  candidateFirstName: string;
  onKeep: () => void;
  /** Called after the flow settles (success OR pool-empty) so the section refetches. */
  onDone: () => void;
}) {
  const { showToast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm(): Promise<void> {
    if (submitting) return;
    setSubmitting(true); setError(null);
    try {
      await cancelInterview(interviewId, { cancelReason: RESCHEDULE_CANCEL_REASON });
    } catch (caught) {
      setError(caught instanceof EmployerInterviewsApiError ? caught.message : 'Could not reschedule. Try again.');
      setSubmitting(false);
      return;
    }
    try {
      await sendPoolSchedulingLink(applicationId);
      showToast('success', `Rescheduled — new scheduling link sent to ${candidateFirstName}.`);
      onDone();
    } catch (caught) {
      // The cancel already happened; the interview now sits cancelled.
      if (caught instanceof EmployerInterviewTimesApiError && caught.code === 'POOL_EMPTY') {
        showToast('error', 'Interview cancelled but no available times to reschedule. Add more times on the posting settings.');
      } else {
        showToast('error', 'Interview cancelled, but sending the new link failed. Use "Send scheduling link" to retry.');
      }
      onDone();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal isOpen={open} onClose={() => { if (!submitting) onKeep(); }} title="Reschedule this interview?" size="sm" footer={(
      <>
        <Button variant="secondary" size="sm" onClick={onKeep} disabled={submitting}>Keep interview</Button>
        <Button size="sm" loading={submitting} disabled={submitting} onClick={() => void handleConfirm()}>Reschedule</Button>
      </>
    )}>
      <Stack gap={10}>
        {error && <Alert type="error">{error}</Alert>}
        <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--ink-muted)', lineHeight: 1.55 }}>
          The candidate&apos;s current time will be released back to the pool and they&apos;ll receive a new
          scheduling link to choose another time.
        </p>
      </Stack>
    </Modal>
  );
}
