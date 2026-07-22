'use client';
// FILE: src/components/employer/jobs/PipelineTab.tsx
// Kanban pipeline: columns are stages, cards are applicants. Drag a card to another
// column to move the applicant. The move is optimistic (C9/R2): local state updates
// instantly, the API fires, and on failure we roll back to the pre-move snapshot and
// toast an error. Archived applicants are filtered out of the board (R3). dnd-kit
// provides keyboard + screen-reader support; announcements are stage-aware (C11).

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  DndContext, DragOverlay, PointerSensor, KeyboardSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent, Announcements } from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { Alert, Button, Stack, SkeletonCard, useToast } from '@/components/ui';
import PipelineColumn from '@/components/employer/jobs/PipelineColumn';
import PipelineCard from '@/components/employer/jobs/PipelineCard';
import { listApplicantsForPosting, listStages, moveApplicant, EmployerApplicantsApiError } from '@/api/employer-applicants-api';
import type { Applicant, Stage } from '@/types/employer-applicants';
import { groupApplicantsByStage, findApplicantById, moveApplicantInMap } from '@/components/employer/jobs/pipeline-tab-helpers';
import { useEmployer } from '@/context/employer/EmployerContext';
import { canMoveApplicant } from '@/lib/team-permissions';
import { trackEvent } from '@/lib/analytics-events';

type LoadState = 'loading' | 'loaded' | 'error';
const LOAD_ERROR_MESSAGE = 'Could not load the pipeline.';

export default function PipelineTab({ postingId }: { postingId: string }) {
  const [byStage, setByStage] = useState<Map<string, Applicant[]>>(new Map());
  const [stages, setStages] = useState<Stage[]>([]);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [lastError, setLastError] = useState<string>(LOAD_ERROR_MESSAGE);
  const [activeApplicantId, setActiveApplicantId] = useState<string | null>(null);
  const { showToast } = useToast();
  // UX gate only — the backend still enforces the move. Unknown role → allow.
  const { viewerRole, viewerCanMoveApplicants, company } = useEmployer();
  const canMove = viewerRole ? canMoveApplicant(viewerRole, viewerCanMoveApplicants) : true;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const load = useCallback(async () => {
    setLoadState('loading');
    try {
      const [applicants, stagesResult] = await Promise.all([
        listApplicantsForPosting(postingId),
        listStages(),
      ]);
      setStages(stagesResult);
      setByStage(groupApplicantsByStage(applicants, stagesResult));
      setLoadState('loaded');
    } catch (error) {
      setLastError(error instanceof EmployerApplicantsApiError ? error.message : LOAD_ERROR_MESSAGE);
      setLoadState('error');
    }
  }, [postingId]);

  useEffect(() => { void load(); }, [load]);

  const activeApplicant = useMemo(
    () => (activeApplicantId ? findApplicantById(byStage, activeApplicantId) : null),
    [activeApplicantId, byStage],
  );

  function handleDragStart(event: DragStartEvent) {
    setActiveApplicantId(String(event.active.id));
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveApplicantId(null);
    if (!canMove) return; // defence-in-depth: cards are already non-draggable
    const { active, over } = event;
    if (!over) return;
    const applicant = findApplicantById(byStage, String(active.id));
    if (!applicant) return;
    const targetStageId = String(over.data.current?.stageId ?? over.id);
    if (applicant.application.stageId === targetStageId) return;

    const previous = byStage;
    const fromStage = applicant.application.stageId;
    setByStage(moveApplicantInMap(byStage, applicant, targetStageId));
    const stageName = stages.find((stage) => stage.id === targetStageId)?.text ?? 'stage';
    const fromStageName = stages.find((stage) => stage.id === fromStage)?.text ?? 'stage';
    try {
      await moveApplicant(applicant.application.id, { stageId: targetStageId });
      trackEvent('applicant_moved_stage', {
        applicationId: applicant.application.id, postingId, companyId: company?.id ?? undefined,
        fromStage, toStage: targetStageId, method: 'drag',
      });
      trackEvent('applicants_moved_stage', {
        companyId: company?.id ?? '', applicantId: applicant.application.id, jobId: postingId,
        fromStage: fromStageName, toStage: stageName,
      });
      showToast('success', `Moved to ${stageName}`);
    } catch {
      setByStage(previous);
      showToast('error', 'Move failed. Please try again.');
    }
  }

  const announcements: Announcements = {
    onDragStart: ({ active }) => `Picked up applicant ${active.id}.`,
    onDragOver: ({ over }) => (over ? `Over ${over.id}.` : ''),
    onDragEnd: ({ over }) => (over ? `Applicant moved to ${over.id}.` : 'Dropped outside the board.'),
    onDragCancel: () => 'Move cancelled.',
  };

  if (loadState === 'loading') return <SkeletonCard lines={5} />;
  if (loadState === 'error') {
    return (
      <Alert type="error">
        <Stack gap={12} dir="row" align="center" justify="space-between" wrap>
          <span>{lastError}</span>
          <Button variant="ghost" size="sm" onClick={() => void load()}>Retry</Button>
        </Stack>
      </Alert>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      accessibility={{ announcements }}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div style={{ display: 'flex', overflowX: 'auto', gap: 12, paddingBottom: 8 }}>
        {stages.map((stage) => (
          <PipelineColumn key={stage.id} stage={stage} applicants={byStage.get(stage.id) ?? []} canMove={canMove} />
        ))}
      </div>
      <DragOverlay>
        {activeApplicant ? <PipelineCard applicant={activeApplicant} isDragging canMove={canMove} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
