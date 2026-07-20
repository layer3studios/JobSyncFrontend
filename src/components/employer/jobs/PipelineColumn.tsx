'use client';
// FILE: src/components/employer/jobs/PipelineColumn.tsx
// One Kanban column = one pipeline stage. useDroppable makes the whole column a drop
// target (even when empty); SortableContext gives keyboard navigation between the
// cards inside it (C11). The column exposes its stageId via droppable `data` so the
// drag-end handler can resolve the destination stage from an empty-column drop.

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Card, Badge } from '@/components/ui';
import PipelineCard from '@/components/employer/jobs/PipelineCard';
import type { Applicant, Stage } from '@/types/employer-applicants';

export default function PipelineColumn({ stage, applicants }: { stage: Stage; applicants: Applicant[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id, data: { stageId: stage.id } });

  return (
    <Card
      padding="sm"
      style={{
        minWidth: 280, maxWidth: 320, flexShrink: 0,
        background: 'var(--surface-sunken)',
        outline: isOver ? '2px solid var(--accent)' : 'none',
      }}
    >
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--ink)' }}>{stage.text}</span>
        <Badge variant="neutral" size="sm">{applicants.length}</Badge>
      </header>
      <div ref={setNodeRef} style={{ minHeight: 40 }}>
        <SortableContext
          items={applicants.map((applicant) => applicant.application.id)}
          strategy={verticalListSortingStrategy}
        >
          {applicants.map((applicant) => (
            <PipelineCard key={applicant.application.id} applicant={applicant} />
          ))}
          {applicants.length === 0 && (
            <div style={{ opacity: 0.5, textAlign: 'center', padding: 24, fontSize: '0.8125rem', color: 'var(--ink-muted)' }}>
              Drop here
            </div>
          )}
        </SortableContext>
      </div>
    </Card>
  );
}
