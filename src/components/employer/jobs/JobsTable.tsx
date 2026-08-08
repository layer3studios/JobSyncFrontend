'use client';
// FILE: src/components/employer/jobs/JobsTable.tsx
// Presentational postings table. The title cell is a router Link so a row is
// navigable by mouse and keyboard (Enter on the focused link) without the base
// Table primitive needing an onRowClick (R5). Status maps to a Badge variant.

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Table } from '@/components/ui';
import type { Column } from '@/components/ui';
import type { Posting } from '@/types/employer-jobs';
import { PostingStatusBadge, ApplicantCount } from '@/components/employer/jobs/parts/PostingStatusBadge';
import { withOrigin, NAV_ORIGINS } from '@/lib/nav-origin';

// The status badge sits INLINE with the title rather than in its own column: a
// separate Status column repeated the same fact one cell to the right, and the
// applicant count needs to read as part of the posting's identity, not as a metric
// column an employer has to scan across for.
const columns: Column<Posting>[] = [
  {
    key: 'title',
    header: 'Title',
    render: (posting) => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <Link
            href={withOrigin(`/employer/jobs/${posting.id}`, NAV_ORIGINS.JOBS)}
            onClick={(event) => event.stopPropagation()}
            style={{ color: 'var(--ink)', fontWeight: 600, textDecoration: 'none' }}
          >
            {posting.title}
          </Link>
          <PostingStatusBadge status={posting.status} />
        </span>
        <ApplicantCount count={posting.applicantCount} />
      </div>
    ),
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
  const router = useRouter();
  return (
    <Table
      columns={columns}
      data={postings}
      onRowClick={(posting) => router.push(withOrigin(`/employer/jobs/${posting.id}`, NAV_ORIGINS.JOBS))}
    />
  );
}
