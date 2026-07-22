'use client';
// FILE: src/components/employer/jobs/DetailSettings.tsx
// Settings tab body for a posting. View mode shows metadata, the public apply URL
// (active only), and Edit + Close/Reopen actions; Edit swaps in the reusable
// PostingForm. Mutations always refetch the server-of-truth via onReload (R2) —
// no optimistic updates. Close/Reopen route through PostingConfirmDialog.

import { useState } from 'react';
import { Card, Button, Badge, Stack, useToast } from '@/components/ui';
import { TYPE } from '@/theme/tokens';
import { useEmployer } from '@/context/employer/EmployerContext';
import { canEditPosting, canClosePosting } from '@/lib/team-permissions';
import PostingForm from '@/components/employer/jobs/PostingForm';
import PostingConfirmDialog from '@/components/employer/jobs/PostingConfirmDialog';
import type { ConfirmAction } from '@/components/employer/jobs/PostingConfirmDialog';
import {
  updateEmployerPosting, closeEmployerPosting, reopenEmployerPosting, EmployerJobsApiError,
} from '@/api/employer-jobs-api';
import type { Posting, PostingStatus, PostingCreateInput } from '@/types/employer-jobs';
import { trackEvent } from '@/lib/analytics-events';

const STATUS_VARIANT: Record<PostingStatus, 'success' | 'warning' | 'neutral'> = {
  active: 'success', draft: 'warning', closed: 'neutral',
};
const LABEL_STYLE = { fontSize: TYPE.sm, color: 'var(--ink-muted)', marginBottom: 6 } as const;
const CODE_STYLE = { fontSize: '0.875rem', color: 'var(--ink)' } as const;

function relTime(dateStr: string): string {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (days <= 0) return 'today';
  if (days === 1) return '1 day ago';
  return `${days} days ago`;
}

function metaLine(posting: Posting): string {
  const parts = [`Created ${relTime(posting.createdAt)}`];
  parts.push(posting.postedAt ? `Posted ${relTime(posting.postedAt)}` : 'Not yet published');
  parts.push(`Updated ${relTime(posting.updatedAt)}`);
  return parts.join(' · ');
}

export default function DetailSettings({ posting, onReload }: {
  posting: Posting;
  onReload: () => Promise<void>;
}) {
  const { company, viewerRole } = useEmployer();
  const { showToast } = useToast();
  // UX gates — Interviewers cannot edit or close postings. Backend still enforces.
  const allowEdit = viewerRole ? canEditPosting(viewerRole) : true;
  const allowClose = viewerRole ? canClosePosting(viewerRole) : true;
  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const [isMutating, setIsMutating] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState<ConfirmAction | null>(null);

  const applyUrl = `${window.location.origin}/apply/${company?.slug ?? ''}/${posting.slug}`;

  const copyApplyUrl = async () => {
    try {
      await navigator.clipboard.writeText(applyUrl);
      showToast('success', 'Apply URL copied to clipboard.');
    } catch {
      showToast('error', 'Could not copy — select and copy manually.');
    }
  };

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
      confirmOpen === 'close'
        ? await closeEmployerPosting(posting.id)
        : await reopenEmployerPosting(posting.id);
      // Reopening a draft is the "publish" transition (draft → active).
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

  if (mode === 'edit') {
    return (
      <Card>
        <PostingForm
          initialValues={{
            title: posting.title, description: posting.description, location: posting.location,
            workplaceType: posting.workplaceType, employmentType: posting.employmentType,
            salaryMin: posting.salaryMin, salaryMax: posting.salaryMax,
          }}
          submitLabel="Save changes"
          onCancel={() => setMode('view')}
          onSubmit={handleSave}
        />
      </Card>
    );
  }

  const salaryText = posting.salaryMin != null || posting.salaryMax != null
    ? `₹ ${posting.salaryMin ?? '—'} – ${posting.salaryMax ?? '—'}`
    : null;

  return (
    <Card>
      <Stack gap={18}>
        <Stack gap={8} dir="row" align="center" wrap>
          <Badge variant={STATUS_VARIANT[posting.status]}>{posting.status}</Badge>
          <span style={{ fontSize: TYPE.sm, color: 'var(--ink-muted)' }}>{metaLine(posting)}</span>
        </Stack>

        <div>
          <p style={LABEL_STYLE}>Public apply URL</p>
          {posting.status === 'active' ? (
            <Stack gap={8} dir="row" align="center" wrap>
              <code style={CODE_STYLE}>{applyUrl}</code>
              <Button variant="ghost" size="sm" onClick={copyApplyUrl}>Copy</Button>
            </Stack>
          ) : (
            <p style={{ fontSize: TYPE.sm, color: 'var(--ink-muted)' }}>
              Not currently accepting applications; reopen to enable.
            </p>
          )}
        </div>

        <div>
          <p style={LABEL_STYLE}>Details</p>
          <p style={{ fontSize: '0.875rem', color: 'var(--ink)' }}>
            {[posting.location, posting.workplaceType, posting.employmentType, salaryText]
              .filter(Boolean).join(' · ')}
          </p>
        </div>

        <div>
          <p style={LABEL_STYLE}>Description</p>
          <p style={{ fontSize: '0.875rem', color: 'var(--ink)', whiteSpace: 'pre-wrap', lineHeight: 1.55 }}>
            {posting.description}
          </p>
        </div>

        <Stack gap={8} dir="row" wrap>
          {allowEdit && <Button onClick={() => setMode('edit')}>Edit</Button>}
          {allowClose && (posting.status === 'draft' || posting.status === 'active') && (
            <Button variant="danger" loading={isMutating} onClick={() => setConfirmOpen('close')}>Close posting</Button>
          )}
          {allowClose && posting.status === 'closed' && (
            <Button variant="secondary" loading={isMutating} onClick={() => setConfirmOpen('reopen')}>Reopen posting</Button>
          )}
        </Stack>
      </Stack>

      <PostingConfirmDialog
        action={confirmOpen}
        isMutating={isMutating}
        onCancel={() => setConfirmOpen(null)}
        onConfirm={handleConfirm}
      />
    </Card>
  );
}
