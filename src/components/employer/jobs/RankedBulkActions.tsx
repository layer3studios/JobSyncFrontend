'use client';
// FILE: src/components/employer/jobs/RankedBulkActions.tsx
// The bulk-archive surface (floating bar + confirm dialog), extracted from
// RankedTab for the line cap. Owns the dialog + submit state; the parent owns
// the selection and reloads after a successful archive.

import { useState } from 'react';
import { useToast } from '@/components/ui';
import { bulkArchiveApplicants } from '@/api/employer-applicants-api';
import type { ArchiveReason } from '@/types/employer-applicants';
import { summarizeBulkResult, resolveBulkErrorMessage } from './ranked-bulk-helpers';
import BulkArchiveBar from './BulkArchiveBar';
import BulkArchiveDialog from './BulkArchiveDialog';
import { trackEvent } from '@/lib/analytics-events';

export default function RankedBulkActions({
  postingId, companyId, reasons, selectedIds, onSelectionChange, onArchived,
}: {
  postingId: string;
  companyId: string | undefined;
  reasons: ArchiveReason[];
  selectedIds: Set<string>;
  onSelectionChange: (next: Set<string>) => void;
  onArchived: () => void;
}) {
  const { showToast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleConfirmArchive({ reasonId, note }: { reasonId: string; note: string }) {
    try {
      setIsSubmitting(true);
      const result = await bulkArchiveApplicants({ applicationIds: [...selectedIds], reasonId, note });
      result.succeeded.forEach(({ id }) => {
        trackEvent('applicant_archived', {
          applicationId: id, postingId, companyId, archiveReason: reasonId, isBulk: true,
        });
        trackEvent('applicants_archived', {
          companyId: companyId ?? '', applicantId: id, jobId: postingId, ...(reasonId ? { reasonId } : {}),
        });
      });
      const { variant, message, nextSelection } = summarizeBulkResult(result, selectedIds);
      showToast(variant, message);
      onSelectionChange(nextSelection);
      setIsDialogOpen(false);
      onArchived();
    } catch (error) {
      showToast('error', resolveBulkErrorMessage(error)); // selection + dialog intact for retry
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <BulkArchiveBar
        selectedCount={selectedIds.size}
        onClear={() => onSelectionChange(new Set())}
        onArchive={() => setIsDialogOpen(true)}
        isSubmitting={isSubmitting}
      />
      <BulkArchiveDialog
        open={isDialogOpen}
        selectedCount={selectedIds.size}
        reasons={reasons}
        isSubmitting={isSubmitting}
        onCancel={() => setIsDialogOpen(false)}
        onConfirm={handleConfirmArchive}
      />
    </>
  );
}
