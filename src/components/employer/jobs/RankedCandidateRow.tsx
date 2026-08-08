'use client';
// FILE: src/components/employer/jobs/RankedCandidateRow.tsx
// One table row. The whole row navigates to the applicant detail; the checkbox
// stops propagation so selecting never navigates. Score renders as a compact
// pill ("98 · strong") coloured by tier; unscored shows a muted "—".

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui';
import type { Applicant } from '@/types/employer-applicants';
import { getScoreBadgeStyle, usableScore } from './score-badge-helpers';
import { formatRelativeTime } from './applicant-view-helpers';
import AssignmentColumn from './parts/AssignmentColumn';
import TimeInStage from './parts/TimeInStage';

export function ScorePill({ applicant }: { applicant: Applicant }) {
  // One source of truth for score colours — shared with the Pipeline card.
  const score = usableScore(applicant.score);
  const badge = getScoreBadgeStyle(score);
  return (
    <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600, background: badge.background, color: badge.color }}>
      {score == null ? '—' : `${score} · ${badge.label}`}
    </span>
  );
}

export default function RankedCandidateRow({
  applicant, postingId, stageName, showSelect, showAssignment, isSelected, onToggleSelect,
}: {
  applicant: Applicant;
  postingId: string;
  stageName: string;
  showSelect: boolean;
  /** Only an assignment posting gets the Task cell — see AssignmentColumn. */
  showAssignment: boolean;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
}) {
  const router = useRouter();
  const [hovered, setHovered] = useState(false);
  const id = applicant.application.id;
  const detailHref = `/employer/jobs/${postingId}/applicants/${id}?from=ranked`;

  return (
    <div
      role="row"
      onClick={() => router.push(detailHref)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', cursor: 'pointer',
        background: hovered ? 'var(--surface-raised)' : 'transparent',
      }}
    >
      {showSelect && (
        <input
          type="checkbox"
          checked={isSelected}
          aria-label={`Select ${applicant.contact?.fullName ?? 'applicant'}`}
          onClick={(event) => event.stopPropagation()}
          onChange={() => onToggleSelect(id)}
          style={{ width: 15, height: 15, accentColor: 'var(--accent)', flexShrink: 0 }}
        />
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)' }}>{applicant.contact?.fullName ?? '—'}</div>
        <div style={{ fontSize: 12, color: 'var(--ink-faint)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {applicant.contact?.email ?? ''}
        </div>
      </div>
      <div style={{ width: 120, flexShrink: 0 }}><ScorePill applicant={applicant} /></div>
      {/* Resume 0–100 and Task 1–5 stay in SEPARATE cells with separate labels.
          Nothing anywhere blends them into one number or one ordering. */}
      {showAssignment && <div style={{ width: 110, flexShrink: 0 }}><AssignmentColumn applicant={applicant} /></div>}
      <div style={{
        width: 100, flexShrink: 0, fontSize: 13, color: 'var(--ink)',
        display: 'flex', alignItems: 'baseline', gap: 6, minWidth: 0,
      }}>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{stageName}</span>
        <TimeInStage movedAt={applicant.application.lastStageMovedAt} />
      </div>
      <div style={{ width: 80, flexShrink: 0, fontSize: 12, color: 'var(--ink-2)' }}>
        {formatRelativeTime(applicant.application.appliedAt)}
      </div>
      <div style={{ width: 60, flexShrink: 0 }} onClick={(event) => event.stopPropagation()}>
        <Button variant="ghost" size="sm" onClick={() => router.push(detailHref)}>View</Button>
      </div>
    </div>
  );
}
