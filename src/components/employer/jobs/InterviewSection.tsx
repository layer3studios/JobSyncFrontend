'use client';
// FILE: src/components/employer/jobs/InterviewSection.tsx
// The "Interview" section of the applicant detail sidebar. Members and above
// can schedule; an interviewer sees the section (and any existing interview)
// but never an action they cannot take — no disabled button, no tooltip.
// The backend 403s regardless; this gate only keeps the UI honest.

import { useState } from 'react';
import { Card, Button, Alert, Stack, useToast } from '@/components/ui';
import { cancelInterview, EmployerInterviewsApiError } from '@/api/employer-interviews-api';
import { useApplicantInterviews } from '@/hooks/employer/useApplicantInterviews';
import { useEmployer } from '@/context/employer/EmployerContext';
import { canScheduleInterview } from '@/lib/team-permissions';
import ScheduleInterviewModal from './ScheduleInterviewModal';
import InterviewCard from './InterviewCard';
import CancelInterviewDialog from './CancelInterviewDialog';

const CANCEL_ERROR = 'Could not cancel the interview. Please try again.';

export default function InterviewSection({
  applicationId, candidateName,
}: {
  applicationId: string;
  candidateName: string | null;
}) {
  const { interviews, loading, error, refetch, activeInterview, hasActiveInterview } = useApplicantInterviews(applicationId);
  const { viewerRole } = useEmployer();
  const { showToast } = useToast();
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [rescheduleId, setRescheduleId] = useState<string | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // UX gate only — the backend enforces truth. Unknown role → allow.
  const allowManage = viewerRole ? canScheduleInterview(viewerRole) : true;
  const candidateFirstName = candidateName?.trim().split(/\s+/)[0] || 'the candidate';
  const latestInterview = interviews[0] ?? null;
  const displayInterview = activeInterview ?? latestInterview;

  function closeModals(): void {
    setScheduleOpen(false);
    setRescheduleId(null);
  }

  async function handleConfirmCancel(cancelReason: string): Promise<void> {
    if (!activeInterview) return;
    setCancelling(true); setActionError(null);
    try {
      await cancelInterview(activeInterview.id, { cancelReason });
      setCancelOpen(false);
      showToast('success', 'Interview cancelled.');
      await refetch();
    } catch (caught) {
      setActionError(caught instanceof EmployerInterviewsApiError ? caught.message : CANCEL_ERROR);
    } finally {
      setCancelling(false);
    }
  }

  return (
    <Card>
      <Stack gap={12}>
        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--ink)' }}>Interview</h3>
        {error && <Alert type="error">{error}</Alert>}
        {actionError && <Alert type="error">{actionError}</Alert>}
        {!loading && displayInterview && (
          <InterviewCard
            interview={displayInterview}
            canManage={allowManage}
            onReschedule={() => setRescheduleId(displayInterview.id)}
            onCancel={() => setCancelOpen(true)}
          />
        )}
        {!loading && !hasActiveInterview && allowManage && (
          <div><Button size="sm" onClick={() => setScheduleOpen(true)}>Schedule interview</Button></div>
        )}
      </Stack>

      {(scheduleOpen || rescheduleId !== null) && (
        <ScheduleInterviewModal
          open
          applicationId={applicationId}
          candidateFirstName={candidateFirstName}
          rescheduleInterviewId={rescheduleId}
          onClose={closeModals}
          onSuccess={() => {
            closeModals();
            showToast('success', rescheduleId ? `New times sent to ${candidateFirstName}` : `Invitation sent to ${candidateFirstName}`);
            void refetch();
          }}
          onViewExisting={() => { closeModals(); void refetch(); }}
        />
      )}
      <CancelInterviewDialog
        open={cancelOpen}
        isSubmitting={cancelling}
        onKeep={() => setCancelOpen(false)}
        onConfirm={(reason) => void handleConfirmCancel(reason)}
      />
    </Card>
  );
}
