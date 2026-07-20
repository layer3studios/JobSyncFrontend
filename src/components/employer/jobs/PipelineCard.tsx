'use client';
// FILE: src/components/employer/jobs/PipelineCard.tsx
// A single draggable applicant card in the Kanban. useSortable wires drag + keyboard
// interaction (dnd-kit gives WCAG keyboard support for free, R1/C11). The card
// carries its stageId in useSortable `data` so the drop handler knows the source
// column. Score renders as a tier-coloured Badge; unscored cards show "Not scored".

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, Badge } from '@/components/ui';
import type { Applicant } from '@/types/employer-applicants';
import { tierBadgeVariant } from '@/components/employer/jobs/applicant-view-helpers';
import { formatKanbanScoreLabel, isScoringInProgress, SCORING_STATE_LABEL } from '@/components/employer/jobs/pipeline-tab-helpers';

export default function PipelineCard({ applicant, isDragging }: { applicant: Applicant; isDragging?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging: isActive } = useSortable({
    id: applicant.application.id,
    data: { stageId: applicant.application.stageId },
  });

  const { contact, score } = applicant;
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging || isActive ? 0.5 : 1,
        marginBottom: 8,
        touchAction: 'none',
      }}
    >
      <Card padding="sm" style={{ cursor: 'grab' }}>
        <div style={{ fontWeight: 600, color: 'var(--ink)', fontSize: '0.875rem' }}>{contact?.fullName ?? '—'}</div>
        <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', marginBottom: 8 }}>{contact?.email ?? ''}</div>
        {score && !score.processingError ? (
          <Badge variant={tierBadgeVariant(score.tier)} size="sm">{formatKanbanScoreLabel(score.score, score.tier)}</Badge>
        ) : (
          <Badge variant="neutral" size="sm">
            {isScoringInProgress(applicant.application.appliedAt) ? SCORING_STATE_LABEL.IN_PROGRESS : SCORING_STATE_LABEL.NOT_SCORED}
          </Badge>
        )}
      </Card>
    </div>
  );
}
