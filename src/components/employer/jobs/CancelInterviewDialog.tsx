'use client';
// FILE: src/components/employer/jobs/CancelInterviewDialog.tsx
// Confirm dialog for cancelling an interview, matching BulkArchiveDialog's
// pattern. The reason is required because it is emailed to the candidate.
// The dismiss control reads "Keep interview" — never "Cancel", which would be
// ambiguous next to "Cancel interview".

import { useEffect, useState } from 'react';
import { Modal, Button, Textarea, Stack } from '@/components/ui';

const REASON_MAX_LENGTH = 500;

export default function CancelInterviewDialog({
  open, isSubmitting, onKeep, onConfirm,
}: {
  open: boolean;
  isSubmitting: boolean;
  onKeep: () => void;
  onConfirm: (cancelReason: string) => void;
}) {
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    if (open) setCancelReason('');
  }, [open]);

  const footer = (
    <>
      <Button variant="secondary" size="sm" onClick={onKeep} disabled={isSubmitting}>Keep interview</Button>
      <Button
        variant="danger"
        size="sm"
        loading={isSubmitting}
        disabled={!cancelReason.trim() || isSubmitting}
        onClick={() => onConfirm(cancelReason.trim())}
      >
        Cancel interview
      </Button>
    </>
  );

  return (
    <Modal isOpen={open} onClose={() => { if (!isSubmitting) onKeep(); }} title="Cancel this interview?" size="sm" footer={footer}>
      <Stack gap={12}>
        <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--ink-muted)', lineHeight: 1.55 }}>
          The candidate will be notified and the calendar entry will be removed.
        </p>
        <Textarea
          label="Reason"
          required
          hint="This reason is emailed to the candidate — keep it considerate."
          maxLength={REASON_MAX_LENGTH}
          value={cancelReason}
          onChange={(event) => setCancelReason(event.target.value)}
        />
      </Stack>
    </Modal>
  );
}
