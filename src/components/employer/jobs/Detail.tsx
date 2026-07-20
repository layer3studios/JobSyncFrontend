'use client';
// FILE: src/components/employer/jobs/Detail.tsx
// Posting detail page. Fetches the posting by :postingId on mount and renders the
// Settings, Pipeline and Ranked tabs (all live). The initial tab honours a ?tab=
// query param (P1.4) so a "Back to posting" link can return the user to where they
// were. Loading / error / not-found states are distinct; not-found does NOT
// auto-redirect (R5) so a stale bookmark is explained rather than silently bounced.

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Container, Card, Button, Alert, PageHeader, Stack, Tabs, SkeletonCard,
} from '@/components/ui';
import type { TabItem } from '@/components/ui';
import DetailSettings from '@/components/employer/jobs/DetailSettings';
import PipelineTab from '@/components/employer/jobs/PipelineTab';
import RankedTab from '@/components/employer/jobs/RankedTab';
import { getEmployerPosting, EmployerJobsApiError } from '@/api/employer-jobs-api';
import type { Posting } from '@/types/employer-jobs';

type LoadState = 'loading' | 'loaded' | 'error' | 'not_found';
const LOAD_ERROR_MESSAGE = 'Could not load this posting.';

// No magic strings for tab ids (C2) — shared with the ?tab query-param plumbing.
const TAB_IDS = { SETTINGS: 'settings', PIPELINE: 'pipeline', RANKED: 'ranked' } as const;
const VALID_TAB_IDS: string[] = Object.values(TAB_IDS);

export function PostingDetail({ postingId }: { postingId: string }) {
  const searchParams = useSearchParams();
  const tabFromUrl = searchParams.get('tab');
  const defaultTabId = tabFromUrl && VALID_TAB_IDS.includes(tabFromUrl) ? tabFromUrl : TAB_IDS.SETTINGS;
  const [posting, setPosting] = useState<Posting | null>(null);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [lastError, setLastError] = useState<string>(LOAD_ERROR_MESSAGE);

  const loadPosting = useCallback(async () => {
    if (!postingId) return;
    setLoadState('loading');
    try {
      const result = await getEmployerPosting(postingId);
      setPosting(result);
      setLoadState('loaded');
    } catch (error) {
      if (error instanceof EmployerJobsApiError && error.status === 404) {
        setLoadState('not_found');
        return;
      }
      setLastError(error instanceof EmployerJobsApiError ? error.message : LOAD_ERROR_MESSAGE);
      setLoadState('error');
    }
  }, [postingId]);

  useEffect(() => { void loadPosting(); }, [loadPosting]);

  function renderBody() {
    if (loadState === 'loading') return <SkeletonCard lines={4} />;
    if (loadState === 'not_found') {
      return (
        <Card>
          <Stack gap={14}>
            <Alert type="error">
              Posting not found. It may have been deleted, or you may not have access to it.
            </Alert>
            <div>
              <Link href="/employer/jobs"><Button variant="secondary">Back to postings</Button></Link>
            </div>
          </Stack>
        </Card>
      );
    }
    if (loadState === 'error' || !posting) {
      return (
        <Alert type="error">
          <Stack gap={12} dir="row" align="center" justify="space-between" wrap>
            <span>{lastError}</span>
            <Button variant="ghost" size="sm" onClick={() => void loadPosting()}>Retry</Button>
          </Stack>
        </Alert>
      );
    }

    const tabs: TabItem[] = [
      { id: TAB_IDS.SETTINGS, label: 'Settings', content: <DetailSettings posting={posting} onReload={loadPosting} /> },
      { id: TAB_IDS.PIPELINE, label: 'Pipeline', content: <PipelineTab postingId={posting.id} /> },
      { id: TAB_IDS.RANKED, label: 'Ranked', content: <RankedTab postingId={posting.id} /> },
    ];
    return <Tabs tabs={tabs} defaultTabId={defaultTabId} />;
  }

  return (
    <Container size="lg" style={{ paddingTop: 32, paddingBottom: 60 }}>
      <PageHeader label="EMPLOYER" title={posting?.title ?? 'Posting'} />
      {renderBody()}
    </Container>
  );
}

export default PostingDetail;
