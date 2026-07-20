'use client';
// FILE: src/components/employer/jobs/JobsList.tsx
// Employer postings list. Refetches on every mount and on tab change — no client
// cache (R1); a Refresh button forces an explicit refetch. Empty and error
// states are distinct screens (R2). 'All' sends no status param (R3).

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Briefcase, RefreshCw } from 'lucide-react';
import {
  Container, Button, Alert, PageHeader, Stack, Tabs, EmptyState, SkeletonCard,
} from '@/components/ui';
import type { TabItem } from '@/components/ui';
import JobsTable from '@/components/employer/jobs/JobsTable';
import { listEmployerPostings, EmployerJobsApiError } from '@/api/employer-jobs-api';
import type { Posting, PostingStatus } from '@/types/employer-jobs';
import { useEmployer } from '@/context/employer/EmployerContext';
import { canCreatePosting } from '@/lib/team-permissions';

type StatusFilter = 'all' | PostingStatus;
type LoadState = 'loading' | 'loaded' | 'error';

const STATUS_TABS: TabItem[] = [
  { id: 'all', label: 'All', content: null },
  { id: 'active', label: 'Active', content: null },
  { id: 'draft', label: 'Draft', content: null },
  { id: 'closed', label: 'Closed', content: null },
];
const LOAD_ERROR_MESSAGE = 'Could not load postings.';

export default function JobsList() {
  const [activeStatus, setActiveStatus] = useState<StatusFilter>('all');
  const [postings, setPostings] = useState<Posting[] | null>(null);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [lastError, setLastError] = useState<string | null>(null);
  // UX gate — Interviewers cannot create postings. Backend still enforces. Unknown → allow.
  const { viewerRole } = useEmployer();
  const allowCreate = viewerRole ? canCreatePosting(viewerRole) : true;

  const load = useCallback(async (status: StatusFilter) => {
    setLoadState('loading');
    try {
      const result = await listEmployerPostings(status === 'all' ? {} : { status });
      setPostings(result);
      setLastError(null);
      setLoadState('loaded');
    } catch (error) {
      setLastError(error instanceof EmployerJobsApiError ? error.message : LOAD_ERROR_MESSAGE);
      setLoadState('error');
    }
  }, []);

  useEffect(() => { void load(activeStatus); }, [activeStatus, load]);

  function renderBody() {
    if (loadState === 'loading') return <SkeletonCard lines={4} />;
    if (loadState === 'error') {
      return (
        <Alert type="error">
          <Stack gap={12} dir="row" align="center" justify="space-between" wrap>
            <span>{lastError}</span>
            <Button variant="ghost" size="sm" onClick={() => void load(activeStatus)}>Retry</Button>
          </Stack>
        </Alert>
      );
    }
    if (!postings || postings.length === 0) {
      return activeStatus === 'all' ? (
        <EmptyState
          icon={<Briefcase size={28} aria-hidden />}
          title="No postings yet"
          description="Create your first posting and share the apply URL with candidates."
          action={allowCreate ? (
            <Link href="/employer/jobs/new">
              <Button variant="primary">Create your first posting</Button>
            </Link>
          ) : undefined}
        />
      ) : (
        <EmptyState
          title="No postings in this status"
          description="Switch tabs above to see other postings."
        />
      );
    }
    return <JobsTable postings={postings} />;
  }

  return (
    <Container size="lg" style={{ paddingTop: 32, paddingBottom: 60 }}>
      <PageHeader
        label="EMPLOYER"
        title="Postings"
        actions={allowCreate ? (
          <Link href="/employer/jobs/new">
            <Button variant="primary">+ New posting</Button>
          </Link>
        ) : undefined}
      />
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ flexGrow: 1, minWidth: 200 }}>
          <Tabs
            tabs={STATUS_TABS}
            defaultTabId="all"
            variant="pill"
            onChange={(id) => setActiveStatus(id as StatusFilter)}
          />
        </div>
        <Button
          variant="ghost"
          size="sm"
          iconLeft={<RefreshCw size={14} aria-hidden />}
          onClick={() => void load(activeStatus)}
        >
          Refresh
        </Button>
      </div>
      <div style={{ marginTop: 8 }}>{renderBody()}</div>
    </Container>
  );
}
