'use client';
// FILE: src/components/employer/jobs/PostingOverview.tsx
// Overview tab, dashboard edition: status/actions top bar, four KPI tiles,
// then Job details (+ pipeline snapshot) beside the scrollable Description.
// Editing still swaps to the existing inline PostingForm; Close keeps its
// confirm dialog with the scheduled-interview warning.

import { useState } from 'react';
import { Pencil } from 'lucide-react';
import { Card, Button, Badge, Stack, useToast } from '@/components/ui';
import { useEmployer } from '@/context/employer/EmployerContext';
import { canEditPosting, canClosePosting } from '@/lib/team-permissions';
import PostingForm from './PostingForm';
import PostingLivePreview from './PostingLivePreview';
import type { PostingFormValues } from './posting-form-helpers';
import PostingConfirmDialog from './PostingConfirmDialog';
import type { ConfirmAction } from './PostingConfirmDialog';
import PostingKpiTiles from './PostingKpiTiles';
import PostingDetailsCard from './PostingDetailsCard';
import PostingDescriptionCard from './PostingDescriptionCard';
import { usePostingOverviewData } from './usePostingOverviewData';
import {
  updateEmployerPosting, closeEmployerPosting, reopenEmployerPosting, EmployerJobsApiError,
} from '@/api/employer-jobs-api';
import { listInterviewTimes } from '@/api/employer-interview-times-api';
import type { Posting, PostingStatus, PostingCreateInput } from '@/types/employer-jobs';
import { trackEvent } from '@/lib/analytics-events';

const STATUS_VARIANT: Record<PostingStatus, 'success' | 'warning' | 'neutral'> = {
  active: 'success', draft: 'warning', closed: 'neutral',
};

function relTime(dateStr: string): string {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  return days <= 0 ? 'today' : days === 1 ? '1 day ago' : `${days} days ago`;
}
const daysOpen = (createdAt: string): number => Math.max(0, Math.floor((Date.now() - new Date(createdAt).getTime()) / 86400000));

const toFormValues = (p: Posting): PostingFormValues => ({
  title: p.title, description: p.description, location: p.location,
  workplaceType: p.workplaceType, employmentType: p.employmentType,
  salaryMinStr: p.salaryMin != null ? String(p.salaryMin) : '',
  salaryMaxStr: p.salaryMax != null ? String(p.salaryMax) : '',
});

export default function PostingOverview({ posting, onReload }: {
  posting: Posting;
  onReload: () => Promise<void>;
}) {
  const { company, viewerRole } = useEmployer();
  const { showToast } = useToast();
  const allowEdit = viewerRole ? canEditPosting(viewerRole) : true;
  const allowClose = viewerRole ? canClosePosting(viewerRole) : true;
  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const [isMutating, setIsMutating] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState<ConfirmAction | null>(null);
  const [previewValues, setPreviewValues] = useState<PostingFormValues>(() => toFormValues(posting));
  const [bookedInterviewCount, setBookedInterviewCount] = useState(0);
  const data = usePostingOverviewData(posting.id);

  const applyUrl = `${window.location.origin}/apply/${company?.slug ?? ''}/${posting.slug}`;
  // Re-seed the preview each time edit opens so it reflects the saved posting.
  const openEdit = () => { setPreviewValues(toFormValues(posting)); setMode('edit'); };

  const copyApplyUrl = async () => {
    try {
      await navigator.clipboard.writeText(applyUrl);
      showToast('success', 'Apply URL copied to clipboard.');
    } catch {
      showToast('error', 'Could not copy — select and copy manually.');
    }
  };

  async function openCloseConfirm(): Promise<void> {
    try {
      const booked = await listInterviewTimes(posting.id, { status: 'booked' });
      setBookedInterviewCount(booked.length);
    } catch {
      setBookedInterviewCount(0);
    }
    setConfirmOpen('close');
  }

  const handleSave = async (input: PostingCreateInput) => {
    await updateEmployerPosting(posting.id, input);
    showToast('success', 'Changes saved');
    await onReload();
    setMode('view');
  };

  const handleConfirm = async () => {
    if (!confirmOpen) return;
    setIsMutating(true);
    try {
      const wasDraft = posting.status === 'draft';
      confirmOpen === 'close' ? await closeEmployerPosting(posting.id) : await reopenEmployerPosting(posting.id);
      if (confirmOpen === 'reopen' && wasDraft) trackEvent('posting_published', { postingId: posting.id });
      showToast('success', confirmOpen === 'close' ? 'Posting closed' : 'Posting reopened');
      await onReload();
      setConfirmOpen(null);
    } catch (err) {
      showToast('error', err instanceof EmployerJobsApiError ? err.message : 'Could not update posting. Try again.');
    } finally {
      setIsMutating(false);
    }
  };

  // Edit mirrors the New-posting layout: form left, live preview right.
  if (mode === 'edit') {
    return (
      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div style={{ flex: '3 1 420px', minWidth: 340 }}>
          <Card variant="raised">
            <PostingForm
              initialValues={{
                title: posting.title, description: posting.description, location: posting.location,
                workplaceType: posting.workplaceType, employmentType: posting.employmentType,
                salaryMin: posting.salaryMin, salaryMax: posting.salaryMax,
              }}
              submitLabel="Save changes"
              onCancel={() => setMode('view')}
              onSubmit={handleSave}
              onValuesChange={setPreviewValues}
            />
          </Card>
        </div>
        <div style={{ flex: '2 1 300px', minWidth: 280 }}>
          <PostingLivePreview values={previewValues} />
        </div>
      </div>
    );
  }

  return (
    <Stack gap={14}>
      {/* Top bar — status + meta on the left, actions on the right. */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <Badge variant={STATUS_VARIANT[posting.status]}>{posting.status}</Badge>
        <span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>
          Created {relTime(posting.createdAt)} · {posting.postedAt ? `Posted ${relTime(posting.postedAt)}` : 'Not yet published'}
        </span>
        <span style={{ marginLeft: 'auto', display: 'inline-flex', gap: 8 }}>
          {allowEdit && (
            <Button variant="ghost" size="sm" aria-label="Edit posting" onClick={openEdit}><Pencil size={14} /></Button>
          )}
          {posting.status === 'active' && <Button variant="secondary" size="sm" onClick={() => void copyApplyUrl()}>Copy apply link</Button>}
          {allowClose && (posting.status === 'draft' || posting.status === 'active') && (
            <Button variant="danger" size="sm" loading={isMutating} onClick={() => void openCloseConfirm()}>Close posting</Button>
          )}
          {allowClose && posting.status === 'closed' && (
            <Button variant="secondary" size="sm" loading={isMutating} onClick={() => setConfirmOpen('reopen')}>Reopen posting</Button>
          )}
        </span>
      </div>

      <PostingKpiTiles
        totalApplicants={data.totalApplicants}
        averageScore={data.averageScore}
        interviewsScheduled={data.interviewsScheduled}
        daysOpen={daysOpen(posting.createdAt)}
      />

      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div style={{ flex: '2 1 300px', minWidth: 280 }}>
          <PostingDetailsCard
            posting={posting} applyUrl={applyUrl} onCopyApplyUrl={() => void copyApplyUrl()}
            stages={data.stages} stageCounts={data.stageCounts}
          />
        </div>
        <div style={{ flex: '3 1 380px', minWidth: 320 }}>
          <PostingDescriptionCard description={posting.description} allowEdit={allowEdit} onEdit={openEdit} />
        </div>
      </div>

      <PostingConfirmDialog
        action={confirmOpen}
        isMutating={isMutating}
        onCancel={() => setConfirmOpen(null)}
        onConfirm={handleConfirm}
        extraWarning={confirmOpen === 'close' && bookedInterviewCount > 0
          ? `${bookedInterviewCount} scheduled interview${bookedInterviewCount === 1 ? '' : 's'} will be cancelled and candidates will be notified.`
          : null}
      />
    </Stack>
  );
}
