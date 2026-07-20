'use client';
// FILE: src/components/employer/jobs/PostingConfirmDialog.tsx
// Close/Reopen confirmation modal built on the shared Modal primitive (which
// already traps focus + handles Escape — we do not reimplement, C11). Focus lands
// on Cancel, the least-destructive action (R1/autoFocus). Overlay-click-to-close
// is disabled so a destructive confirm requires an explicit choice (C11).

import { Button, Modal } from '@/components/ui';

export type ConfirmAction = 'close' | 'reopen';

const COPY: Record<ConfirmAction, { title: string; body: string; confirmLabel: string }> = {
  close: {
    title: 'Close this posting?',
    body: "Applicants won't be able to apply until you reopen it. Existing applications remain in your inbox.",
    confirmLabel: 'Close posting',
  },
  reopen: {
    title: 'Reopen this posting?',
    body: 'The posting will be visible on the public apply URL again and applicants can submit new applications.',
    confirmLabel: 'Reopen posting',
  },
};

export default function PostingConfirmDialog({
  action, isMutating, onCancel, onConfirm,
}: {
  action: ConfirmAction | null;
  isMutating: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (action === null) return null;
  const copy = COPY[action];

  return (
    <Modal
      isOpen
      onClose={() => { if (!isMutating) onCancel(); }}
      title={copy.title}
      size="sm"
      closeOnOverlayClick={false}
      footer={(
        <>
          <Button variant="ghost" autoFocus disabled={isMutating} onClick={onCancel}>Cancel</Button>
          <Button
            variant={action === 'close' ? 'danger' : 'primary'}
            loading={isMutating}
            onClick={onConfirm}
          >
            {copy.confirmLabel}
          </Button>
        </>
      )}
    >
      {copy.body}
    </Modal>
  );
}
