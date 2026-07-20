'use client';
// FILE: src/components/employer/jobs/ApplicantDetailBody.tsx
// Body of the applicant detail page, split out of ApplicantDetail to keep both files
// under the line cap. Owns the desktop two-column / mobile-stack layout (P8) and the
// per-load-state rendering (skeleton / not-found / error / loaded). Behaviour is
// identical to the original single-file page — this is a mechanical extraction.

import type { CSSProperties } from 'react';
import Link from 'next/link';
import { Card, Button, Alert, Stack, SkeletonCard } from '@/components/ui';
import type { ApplicantDetail, Stage, ArchiveReason } from '@/types/employer-applicants';
import ApplicantResumeViewer from './ApplicantResumeViewer';
import ApplicantReviewPanel from './ApplicantReviewPanel';
import ApplicantContactCard from './ApplicantContactCard';
import ApplicantCoverNote from './ApplicantCoverNote';
import ApplicantNotesCard from './ApplicantNotesCard';

export type LoadState = 'loading' | 'loaded' | 'error' | 'not_found';

// No-page-scroll (P8/D2/D3): grid children own their height and scroll internally.
const GRID_STYLE: CSSProperties = {
  display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(360px, 1fr)',
  gap: 20, alignItems: 'stretch', flex: 1, minHeight: 0,
};
const LEFT_COLUMN_STYLE: CSSProperties = { height: '100%', overflow: 'hidden', minHeight: 0 };
const RIGHT_COLUMN_STYLE: CSSProperties = { height: '100%', overflowY: 'auto', overflowX: 'hidden', paddingRight: 6, minHeight: 0 };

export default function ApplicantDetailBody({
  loadState, detail, stages, reasons, lastError, load, twoColumn, backHref,
}: {
  loadState: LoadState;
  detail: ApplicantDetail | null;
  stages: Stage[];
  reasons: ArchiveReason[];
  lastError: string;
  load: () => Promise<void> | void;
  twoColumn: boolean;
  backHref: string;
}) {
  if (loadState === 'loading') return <SkeletonCard lines={6} />;
  if (loadState === 'not_found') {
    return (
      <Card>
        <Stack gap={14}>
          <Alert type="error">Applicant not found. The application may have been removed, or you may not have access to it.</Alert>
          <div><Link href={backHref}><Button variant="secondary">Back to posting</Button></Link></div>
        </Stack>
      </Card>
    );
  }
  if (loadState === 'error' || !detail) {
    return (
      <Alert type="error">
        <Stack gap={12} dir="row" align="center" justify="space-between" wrap>
          <span>{lastError}</span>
          <Button variant="ghost" size="sm" onClick={() => void load()}>Retry</Button>
        </Stack>
      </Alert>
    );
  }

  const viewer = <ApplicantResumeViewer applicationId={detail.application.id} resumeMeta={detail.resumeMeta} initialUrl={detail.resumeDownloadUrl} />;
  const sidebar = (
    <ApplicantReviewPanel
      score={detail.score}
      scoreJobStatus={detail.scoreJobStatus}
      applicationId={detail.application.id}
      currentStageId={detail.application.stageId}
      archived={Boolean(detail.application.archived)}
      stages={stages}
      reasons={reasons}
      stageChanges={detail.stageChanges}
      onDone={load}
    />
  );
  // Contact "business card" at the very top of the sidebar — what the employer reaches
  // for first, visible on load without scrolling. Renders nothing if there's no contact.
  const contactCard = detail.contact ? <ApplicantContactCard contact={detail.contact} /> : null;
  // Candidate-voiced note (R1/R2): shown above the review panel, only when non-empty (R3).
  const coverNote = detail.application.coverNote?.trim() || null;
  const coverNoteCard = coverNote ? <ApplicantCoverNote coverNote={coverNote} /> : null;
  // Notes (C3) sit last in the sidebar and fetch their own list (D8). The card grows
  // inside RIGHT_COLUMN_STYLE's own overflow-y region, so the page still never scrolls (P8).
  const notesCard = <ApplicantNotesCard applicationId={detail.application.id} />;

  if (!twoColumn) {
    return <Stack gap={16}>{viewer}{contactCard}{coverNoteCard}{sidebar}{notesCard}</Stack>;
  }
  return (
    <div style={GRID_STYLE}>
      <div style={LEFT_COLUMN_STYLE}>{viewer}</div>
      <div style={RIGHT_COLUMN_STYLE}>
        <Stack gap={16}>{contactCard}{coverNoteCard}{sidebar}{notesCard}</Stack>
      </div>
    </div>
  );
}
