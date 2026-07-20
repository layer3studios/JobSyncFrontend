'use client';
// FILE: src/components/employer/jobs/ApplicantDetail.tsx
// Applicant detail page. Desktop (>900px) is two full-width columns (resume left, 3-card
// sidebar right, P8), mobile stacks them. PP2 adds prev/next over the source-tab list.
// The layout body lives in ApplicantDetailBody (line-cap split); this file owns data
// loading, route params, back-link resolution, and keyboard prev/next/back nav.

import { useCallback, useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Container, Button, PageHeader } from '@/components/ui';
import { fetchApplicantDetail, listApplicantsForPosting, listStages, listArchiveReasons, EmployerApplicantsApiError } from '@/api/employer-applicants-api';
import type { Applicant, ApplicantDetail, ApplicantSort, Stage, ArchiveReason } from '@/types/employer-applicants';
import { useViewport } from '@/hooks/shared/useViewport';
import { useApplicantKeyboardNav } from '@/hooks/employer/useApplicantKeyboardNav';
import ApplicantStickyHeader from './ApplicantStickyHeader';
import ApplicantDetailBody, { type LoadState } from './ApplicantDetailBody';

type ListStatus = 'idle' | 'loading' | 'loaded' | 'failed';
const LOAD_ERROR_MESSAGE = 'Could not load this applicant.';

// Prev/next list order mirrors the source tab (PP2/R4): Ranked → score, else date.
const sortForFrom = (from: string | null): ApplicantSort => (from === 'ranked' ? 'score' : 'date');

// No magic strings for tab ids (C2/D6). Only pipeline/ranked are returnable.
const TAB_IDS = { SETTINGS: 'settings', PIPELINE: 'pipeline', RANKED: 'ranked' } as const;
const RETURNABLE_TAB_IDS: string[] = [TAB_IDS.PIPELINE, TAB_IDS.RANKED];
// Back-link copy mirrors the ?from source (P2.1/D4); unknown/missing → generic.
const BACK_LABEL_BY_FROM = { ranked: 'Back to Ranked', pipeline: 'Back to Pipeline' } as const;
const DEFAULT_BACK_LABEL = 'Back to posting';

function resolveBackLabel(from: string | null): string {
  if (from === TAB_IDS.RANKED || from === TAB_IDS.PIPELINE) return BACK_LABEL_BY_FROM[from];
  return DEFAULT_BACK_LABEL;
}
// No-page-scroll (P8/D2/D3): wrapper pinned to viewport minus N1 nav; overflow:hidden clips so
// the document never scrolls. Grid children own their height and scroll internally.
const NAV_HEIGHT_PIXELS = 65;
const PAGE_HORIZONTAL_PADDING_PIXELS = 24;
const WRAPPER_STYLE: CSSProperties = {
  width: '100%', height: `calc(100vh - ${NAV_HEIGHT_PIXELS}px)`, overflow: 'hidden',
  paddingLeft: PAGE_HORIZONTAL_PADDING_PIXELS, paddingRight: PAGE_HORIZONTAL_PADDING_PIXELS,
  boxSizing: 'border-box', display: 'flex', flexDirection: 'column',
};

export default function ApplicantDetail() {
  const params = useParams<{ postingId: string; applicationId: string }>();
  const postingId = typeof params.postingId === 'string' ? params.postingId : '';
  const appId = typeof params.applicationId === 'string' ? params.applicationId : '';
  const searchParams = useSearchParams();
  const router = useRouter();
  const { w } = useViewport();
  const twoColumn = w > 900;

  const [detail, setDetail] = useState<ApplicantDetail | null>(null);
  const [stages, setStages] = useState<Stage[]>([]);
  const [reasons, setReasons] = useState<ArchiveReason[]>([]);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [lastError, setLastError] = useState<string>(LOAD_ERROR_MESSAGE);
  const [listApplicants, setListApplicants] = useState<Applicant[]>([]);
  const [, setListStatus] = useState<ListStatus>('idle');

  const load = useCallback(async () => {
    if (!appId) return;
    setLoadState('loading');
    try {
      const [detailResult, stagesResult, reasonsResult] = await Promise.all([
        fetchApplicantDetail(appId),
        listStages(),
        listArchiveReasons(),
      ]);
      setDetail(detailResult);
      setStages(stagesResult);
      setReasons(reasonsResult);
      setLoadState('loaded');
    } catch (error) {
      if (error instanceof EmployerApplicantsApiError && error.status === 404) {
        setLoadState('not_found');
        return;
      }
      setLastError(error instanceof EmployerApplicantsApiError ? error.message : LOAD_ERROR_MESSAGE);
      setLoadState('error');
    }
  }, [appId]);

  useEffect(() => { void load(); }, [load]);
  // Return the user to the tab they came from (P1.4): ?from=pipeline|ranked → ?tab=…
  const fromTab = searchParams.get('from');
  const backTabQuery = fromTab && RETURNABLE_TAB_IDS.includes(fromTab) ? `?tab=${fromTab}` : '';
  const backHref = postingId ? `/employer/jobs/${postingId}${backTabQuery}` : '/employer/jobs';
  const backLabel = resolveBackLabel(fromTab);
  // Prev/next (PP2): fetch the source-tab-ordered list; failure degrades silently (D2).
  useEffect(() => {
    if (!postingId) return undefined;
    let isActive = true;
    setListStatus('loading');
    listApplicantsForPosting(postingId, { sort: sortForFrom(fromTab) })
      .then((items) => { if (isActive) { setListApplicants(items); setListStatus('loaded'); } })
      .catch(() => { if (isActive) setListStatus('failed'); });
    return () => { isActive = false; };
  }, [postingId, fromTab]);
  const currentIndex = listApplicants.findIndex((item) => item.application.id === appId);
  const isInList = currentIndex >= 0;
  const buildDetailHref = (targetId: string) => `/employer/jobs/${postingId}/applicants/${targetId}${fromTab ? `?from=${fromTab}` : ''}`;
  const previousHref = isInList && currentIndex > 0 ? buildDetailHref(listApplicants[currentIndex - 1].application.id) : null;
  const nextHref = isInList && currentIndex < listApplicants.length - 1 ? buildDetailHref(listApplicants[currentIndex + 1].application.id) : null;
  const positionText = isInList ? `${currentIndex + 1} of ${listApplicants.length}` : '';
  useApplicantKeyboardNav({
    onPrev: previousHref ? () => router.push(previousHref) : null,
    onNext: nextHref ? () => router.push(nextHref) : null,
    onEscape: () => router.push(backHref),
  });

  const body = (
    <ApplicantDetailBody
      loadState={loadState} detail={detail} stages={stages} reasons={reasons}
      lastError={lastError} load={load} twoColumn={twoColumn} backHref={backHref}
    />
  );

  const name = detail?.contact?.fullName ?? 'Applicant';
  const email = detail?.contact?.email;

  // Desktop pins a sticky bar with the back-CTA + identity (P2.1/P2.4); mobile keeps PageHeader.
  const header = twoColumn ? (
    <ApplicantStickyHeader
      backHref={backHref} backLabel={backLabel} candidateName={name} candidateEmail={email ?? null}
      previousHref={previousHref} nextHref={nextHref} positionText={positionText}
    />
  ) : (
    <PageHeader
      label="APPLICANT" title={name} subtitle={email}
      actions={<Link href={backHref}><Button variant="ghost" size="sm">{backLabel}</Button></Link>}
    />
  );

  // Desktop: full-width fixed-viewport wrapper (P8); mobile keeps the centred Container.
  if (twoColumn) {
    return (
      <div style={WRAPPER_STYLE}>
        {header}
        {body}
      </div>
    );
  }
  return (
    <Container size="xl" style={{ paddingTop: 32, paddingBottom: 60 }}>
      {header}
      {body}
    </Container>
  );
}
