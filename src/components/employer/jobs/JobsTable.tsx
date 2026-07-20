'use client';
// FILE: src/components/employer/jobs/JobsTable.tsx
// Presentational postings table. The title cell is a router Link so a row is
// navigable by mouse and keyboard (Enter on the focused link) without the base
// Table primitive needing an onRowClick (R5). Status maps to a Badge variant.

import Link from 'next/link';
import { Table, Badge } from '@/components/ui';
import type { Column } from '@/components/ui';
import type { Posting, PostingStatus } from '@/types/employer-jobs';

const STATUS_VARIANT: Record<PostingStatus, 'success' | 'warning' | 'neutral'> = {
  active: 'success',
  draft: 'warning',
  closed: 'neutral',
};

const columns: Column<Posting>[] = [
  {
    key: 'title',
    header: 'Title',
    render: (posting) => (
      <Link href={`/employer/jobs/${posting.id}`} style={{ color: 'var(--ink)', fontWeight: 600, textDecoration: 'none' }}>
        {posting.title}
      </Link>
    ),
  },
  {
    key: 'status',
    header: 'Status',
    render: (posting) => <Badge variant={STATUS_VARIANT[posting.status]}>{posting.status}</Badge>,
  },
  { key: 'location', header: 'Location', render: (posting) => posting.location },
  { key: 'workplaceType', header: 'Work type', render: (posting) => posting.workplaceType },
  {
    key: 'createdAt',
    header: 'Created',
    render: (posting) => new Date(posting.createdAt).toLocaleDateString(),
  },
];

export default function JobsTable({ postings }: { postings: Posting[] }) {
  return <Table columns={columns} data={postings} />;
}
