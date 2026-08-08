'use client';
// FILE: src/components/employer/jobs/parts/PostingActionBar.tsx
// The status + actions row at the top of the posting Overview tab. Extracted from
// PostingOverview so that file stays under the 200-line ceiling as actions grow.
// Purely presentational: every action is a callback the parent owns, so the
// mutation logic and this layout never drift into the same component.

import { Pencil } from 'lucide-react';
import Link from 'next/link';
import { Button, Badge } from '@/components/ui';
import type { Posting, PostingStatus } from '@/types/employer-jobs';

const STATUS_VARIANT: Record<PostingStatus, 'success' | 'warning' | 'neutral'> = {
  active: 'success', draft: 'warning', closed: 'neutral',
};

function relativeTime(dateStr: string): string {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  return days <= 0 ? 'today' : days === 1 ? '1 day ago' : `${days} days ago`;
}

export default function PostingActionBar({
  posting, allowEdit, allowClose, isMutating,
  onEdit, onCopyApplyUrl, onCloseposting, onReopen, onFill,
}: {
  posting: Posting;
  allowEdit: boolean;
  allowClose: boolean;
  isMutating: boolean;
  onEdit: () => void;
  onCopyApplyUrl: () => void;
  onCloseposting: () => void;
  onReopen: () => void;
  onFill: () => void;
}) {
  const isOpenForApplicants = posting.status === 'draft' || posting.status === 'active';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
      <Badge variant={STATUS_VARIANT[posting.status]}>{posting.status}</Badge>
      <span style={{ fontSize: 12, color: 'var(--ink-muted)' }}>
        Created {relativeTime(posting.createdAt)} · {posting.postedAt ? `Posted ${relativeTime(posting.postedAt)}` : 'Not yet published'}
      </span>
      <span style={{ marginLeft: 'auto', display: 'inline-flex', gap: 8, flexWrap: 'wrap' }}>
        {allowEdit && (
          <Button variant="ghost" size="sm" aria-label="Edit posting" onClick={onEdit}><Pencil size={14} /></Button>
        )}
        {/* Duplicate is a plain link: the New page reads ?duplicate and fetches the
            source itself, so there is nothing to mutate here. Available on any
            status — copying a closed posting to re-run the role is the common case. */}
        {allowEdit && (
          <Link href={`/employer/jobs/new?duplicate=${posting.id}`}>
            <Button variant="secondary" size="sm">Duplicate</Button>
          </Link>
        )}
        {posting.status === 'active' && (
          <Button variant="secondary" size="sm" onClick={onCopyApplyUrl}>Copy apply link</Button>
        )}
        {allowClose && isOpenForApplicants && (
          <Button variant="secondary" size="sm" loading={isMutating} onClick={onFill}>Position filled</Button>
        )}
        {allowClose && isOpenForApplicants && (
          <Button variant="danger" size="sm" loading={isMutating} onClick={onCloseposting}>Close posting</Button>
        )}
        {allowClose && posting.status === 'closed' && (
          <Button variant="secondary" size="sm" loading={isMutating} onClick={onReopen}>Reopen posting</Button>
        )}
      </span>
    </div>
  );
}
