'use client';
// FILE: src/components/employer/jobs/ApplicantDetailBody.tsx
// Body of the applicant detail page, split out of ApplicantDetail to keep both files
// under the line cap. Owns the desktop two-column / mobile-stack layout (P8) and the
// per-load-state rendering (skeleton / not-found / error / loaded). Behaviour is
// identical to the original single-file page — this is a mechanical extraction.

import { useState } from 'react';
import type { CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, Button, Alert, Stack, SkeletonCard, useToast } from '@/components/ui';
import { useEmployer } from '@/context/employer/EmployerContext';
import { canMoveApplicant, canArchiveApplicant, canScheduleInterview } from '@/lib/team-permissions';
import { moveApplicant, EmployerApplicantsApiError } from '@/api/employer-applicants-api';
import type { ApplicantDetail, Stage, ArchiveReason } from '@/types/employer-applicants';
import ApplicantResumeViewer from './ApplicantResumeViewer';
import ApplicantReviewPanel from './ApplicantReviewPanel';
import ApplicantContactCard from './ApplicantContactCard';
import ApplicantCoverNote from './ApplicantCoverNote';
import ApplicantNotesCard from './ApplicantNotesCard';
import InterviewSection from './InterviewSection';
import CandidateTimeline from './CandidateTimeline';
import AssignmentReviewPanel from './parts/AssignmentReviewPanel';
import ApplicantActionBar from './parts/ApplicantActionBar';

export type LoadState = 'loading' | 'loaded' | 'error' | 'not_found';

// No-page-scroll (P8/D2/D3): grid children own their height and scroll internally.
const GRID_STYLE: CSSProperties = {
  display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(360px, 1fr)',
  gap: 20, alignItems: 'stretch', flex: 1, minHeight: 0,
};
const LEFT_COLUMN_STYLE: CSSProperties = { height: '100%', overflow: 'hidden', minHeight: 0 };
const RIGHT_COLUMN_STYLE: CSSProperties = { height: '100%', overflowY: 'auto', overflowX: 'hidden', paddingRight: 6, minHeight: 0 };

export default function ApplicantDetailBody({
  loadState, detail, stages, reasons, lastError, load, twoColumn, backHref, currentEmployerUserId = null,
  previousHref = null, nextHref = null, positionText = '',
}: {
  loadState: LoadState;
  detail: ApplicantDetail | null;
  stages: Stage[];
  reasons: ArchiveReason[];
  lastError: string;
  load: () => Promise<void> | void;
  twoColumn: boolean;
  backHref: string;
  /** Distinguishes "my review" from "a teammate's" — see AssignmentReviewPanel. */
  currentEmployerUserId?: string | null;
  /** Prev/next, mirrored into the sticky action bar so triage never leaves it. */
  previousHref?: string | null;
  nextHref?: string | null;
  positionText?: string;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const { viewerRole, viewerCanMoveApplicants, viewerCanArchiveApplicants } = useEmployer();
  const [isMoving, setIsMoving] = useState(false);

  // UX gates only — the backend enforces each of these. Unknown role → allow.
  const canMove = viewerRole ? canMoveApplicant(viewerRole, viewerCanMoveApplicants) : true;
  const canArchive = viewerRole ? canArchiveApplicant(viewerRole, viewerCanArchiveApplicants) : true;
  const canSchedule = viewerRole ? canScheduleInterview(viewerRole) : true;

  const applicationId = detail?.application.id ?? '';
  const onMove = async (stageId: string) => {
    if (!applicationId || stageId === detail?.application.stageId) return;
    setIsMoving(true);
    try {
      await moveApplicant(applicationId, { stageId });
      showToast('success', `Moved to ${stages.find((s) => s.id === stageId)?.text ?? 'stage'}`);
      await load();
    } catch (error) {
      showToast('error', error instanceof EmployerApplicantsApiError ? error.message : 'Could not move this applicant.');
    } finally {
      setIsMoving(false);
    }
  };

  // Archiving removes the applicant from the active pipeline, so staying on a page
  // that now describes an archived record is disorienting — go back to the list.
  const onArchived = (candidateName: string) => {
    showToast('success', `Archived ${candidateName}`);
    router.push(backHref);
  };

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
  const isArchived = Boolean(detail.application.archived);
  const sidebar = (
    <ApplicantReviewPanel
      score={detail.score}
      scoreJobStatus={detail.scoreJobStatus}
      applicationId={detail.application.id}
      currentStageId={detail.application.stageId}
      archived={isArchived}
      stages={stages}
      reasons={reasons}
      stageChanges={detail.stageChanges}
      onDone={load}
      // While active, the sticky bar owns move + archive. Once archived it hands
      // back, because unarchive lives on the panel and nowhere else.
      showActions={isArchived}
    />
  );
  // Pinned to the top of the sidebar so the decision is reachable without scrolling
  // past the contact card, the cover note and the whole score region.
  const actionBar = (
    <ApplicantActionBar
      candidateName={detail.contact?.fullName ?? 'this candidate'}
      applicationId={detail.application.id}
      currentStageId={detail.application.stageId}
      stages={stages}
      reasons={reasons}
      archived={isArchived}
      canMove={canMove}
      canArchive={canArchive}
      canSchedule={canSchedule}
      isMoving={isMoving}
      previousHref={previousHref}
      nextHref={nextHref}
      positionText={positionText}
      onMove={onMove}
      onArchived={onArchived}
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
  // Merged history sits ABOVE notes: the story first, the conversation below.
  // Notes stay as their own card — composing a note inline in a timeline is
  // clumsy, and notes also appear inside the timeline as events.
  const timeline = (
    <CandidateTimeline applicationId={detail.application.id} candidateName={detail.contact?.fullName ?? null} />
  );
  // Interview scheduling sits below the review panel, above the timeline.
  const interviewSection = (
    <InterviewSection
      applicationId={detail.application.id}
      candidateName={detail.contact?.fullName ?? null}
      candidatePhone={detail.contact?.phone ?? null}
      stages={stages}
      reasons={reasons}
      onApplicantChanged={() => void load()}
    />
  );

  // Absent for a plain posting, and for a legacy application on a posting that
  // gained an assignment later — in both cases the page renders exactly as before.
  const assignmentCard = detail.assignmentSubmission ? (
    <AssignmentReviewPanel
      submission={detail.assignmentSubmission}
      review={detail.assignmentReview ?? null}
      currentEmployerUserId={currentEmployerUserId}
      onSaved={load}
    />
  ) : null;

  if (!twoColumn) {
    return <Stack gap={16}>{viewer}{actionBar}{contactCard}{coverNoteCard}{assignmentCard}{sidebar}{interviewSection}{timeline}{notesCard}</Stack>;
  }
  return (
    <div style={GRID_STYLE}>
      <div style={LEFT_COLUMN_STYLE}>{viewer}</div>
      <div style={RIGHT_COLUMN_STYLE}>
        <Stack gap={16}>{actionBar}{contactCard}{coverNoteCard}{assignmentCard}{sidebar}{interviewSection}{timeline}{notesCard}</Stack>
      </div>
    </div>
  );
}
