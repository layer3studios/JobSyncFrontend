'use client';
// FILE: src/components/employer/jobs/RankedTab.tsx
// Ranked applicant table: applicants + stages + archive reasons fetched in parallel,
// with client-side filtering and a floating bulk-archive bar. Chunk 5 hides the row
// selection + bulk bar entirely when the viewer can't archive (D_impl_ui5_9).

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Card, Button, Alert, Stack, Select, EmptyState, SkeletonCard, useToast,
} from '@/components/ui';
import { Table } from '@/components/ui';
import type { Column } from '@/components/ui';
import {
  listApplicantsForPosting, listStages, listArchiveReasons,
  bulkArchiveApplicants, EmployerApplicantsApiError,
} from '@/api/employer-applicants-api';
import type { Applicant, ArchiveReason, Stage, ApplicantSort } from '@/types/employer-applicants';
import { formatRelativeTime } from '@/components/employer/jobs/applicant-view-helpers';
import { summarizeBulkResult, resolveBulkErrorMessage } from '@/components/employer/jobs/ranked-bulk-helpers';
import { filterRankedApplicants, createInitialRankedFilterState, toggleSetValue } from '@/components/employer/jobs/ranked-filter-helpers';
import type { RankedFilterState } from '@/components/employer/jobs/ranked-filter-helpers';
import RankedFilterBar from '@/components/employer/jobs/RankedFilterBar';
import ScoreCell from '@/components/employer/jobs/RankedScoreCell';
import BulkArchiveBar from '@/components/employer/jobs/BulkArchiveBar';
import BulkArchiveDialog from '@/components/employer/jobs/BulkArchiveDialog';
import { useEmployer } from '@/context/employer/EmployerContext';
import { canBulkArchive } from '@/lib/team-permissions';
import { trackEvent } from '@/lib/analytics-events';

type LoadState = 'loading' | 'loaded' | 'error';
const LOAD_ERROR_MESSAGE = 'Could not load applicants.';

const SORT_OPTIONS = [
  { value: 'score', label: 'Score: high to low' },
  { value: 'date', label: 'Applied: newest first' },
];

export default function RankedTab({ postingId }: { postingId: string }) {
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [reasons, setReasons] = useState<ArchiveReason[]>([]);
  const [sort, setSort] = useState<ApplicantSort>('score');
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [lastError, setLastError] = useState<string>(LOAD_ERROR_MESSAGE);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filterState, setFilterState] = useState<RankedFilterState>(createInitialRankedFilterState);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();
  // Bulk archive is the only multi-select action here, so hide the selection UI
  // entirely when the viewer can't archive (D_impl_ui5_9). Backend still enforces.
  const { viewerRole, viewerCanArchiveApplicants, company } = useEmployer();
  const allowArchive = viewerRole ? canBulkArchive(viewerRole, viewerCanArchiveApplicants) : true;

  const load = useCallback(async (activeSort: ApplicantSort) => {
    setLoadState('loading');
    try {
      const [applicantsResult, stagesResult, reasonsResult] = await Promise.all([
        listApplicantsForPosting(postingId, { sort: activeSort }),
        listStages(),
        listArchiveReasons(),
      ]);
      setApplicants(applicantsResult);
      setStages(stagesResult);
      setReasons(reasonsResult);
      // Prune selection to ids still present after a reload (hygiene, D5).
      const presentIds = new Set(applicantsResult.map((item) => item.application.id));
      setSelectedIds((prev) => new Set([...prev].filter((id) => presentIds.has(id))));
      setLoadState('loaded');
    } catch (error) {
      setLastError(error instanceof EmployerApplicantsApiError ? error.message : LOAD_ERROR_MESSAGE);
      setLoadState('error');
    }
  }, [postingId]);

  useEffect(() => { void load(sort); }, [load, sort]);

  const handleToggleRow = (id: string) => setSelectedIds((prev) => toggleSetValue(prev, id));
  const filteredApplicants = useMemo(
    () => filterRankedApplicants(applicants, filterState), [applicants, filterState],
  );

  // "Select all" acts only on what is currently visible; filtering never prunes an
  // existing selection, so a selected-but-hidden row still bulk-archives (C11/R3).
  const visibleIds = filteredApplicants.map((item) => item.application.id);
  const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));
  const someSelected = visibleIds.some((id) => selectedIds.has(id));
  const handleTogglePage = () => setSelectedIds((prev) => {
    if (!allSelected) return new Set([...prev, ...visibleIds]);
    return new Set([...prev].filter((id) => !visibleIds.includes(id)));
  });

  async function handleConfirmArchive({ reasonId, note }: { reasonId: string; note: string }) {
    try {
      setIsSubmitting(true);
      const result = await bulkArchiveApplicants({ applicationIds: [...selectedIds], reasonId, note });
      result.succeeded.forEach(({ id }) => trackEvent('applicant_archived', {
        applicationId: id, postingId, companyId: company?.id ?? undefined, archiveReason: reasonId, isBulk: true,
      }));
      const { variant, message, nextSelection } = summarizeBulkResult(result, selectedIds);
      showToast(variant, message);
      setSelectedIds(nextSelection);
      setIsDialogOpen(false);
      void load(sort);
    } catch (error) {
      showToast('error', resolveBulkErrorMessage(error)); // selection + dialog intact for retry
    } finally {
      setIsSubmitting(false);
    }
  }

  const stageNameById = new Map(stages.map((stage) => [stage.id, stage.text]));

  const selectColumn: Column<Applicant> = { key: 'select', header: '', render: (applicant) => {
    const id = applicant.application.id;
    const isSelected = selectedIds.has(id);
    return (
      <div style={{ background: isSelected ? 'var(--paper-2)' : 'transparent', margin: '-10px -14px', padding: '10px 14px' }}>
        <input type="checkbox" checked={isSelected} aria-label={`Select ${applicant.contact?.fullName ?? 'applicant'}`}
          onClick={(event) => event.stopPropagation()} onChange={() => handleToggleRow(id)} />
      </div>
    );
  } };

  const columns: Column<Applicant>[] = [
    ...(allowArchive ? [selectColumn] : []),
    { key: 'applicant', header: 'Applicant', render: (applicant) => (
      <div>
        <div style={{ fontWeight: 600, color: 'var(--ink)' }}>{applicant.contact?.fullName ?? '—'}</div>
        <div style={{ fontSize: '0.78rem', color: 'var(--ink-muted)' }}>{applicant.contact?.email ?? ''}</div>
      </div>
    ) },
    { key: 'score', header: 'Score', render: (applicant) => <ScoreCell applicant={applicant} /> },
    { key: 'stage', header: 'Stage', render: (applicant) => stageNameById.get(applicant.application.stageId) ?? '—' },
    { key: 'applied', header: 'Applied', render: (applicant) => formatRelativeTime(applicant.application.appliedAt) },
    { key: 'actions', header: '', render: (applicant) => (
      <Link href={`/employer/jobs/${postingId}/applicants/${applicant.application.id}?from=ranked`}>
        <Button variant="ghost" size="sm">View</Button>
      </Link>
    ) },
  ];

  if (loadState === 'loading') return <SkeletonCard lines={5} />;
  if (loadState === 'error') {
    return (
      <Alert type="error">
        <Stack gap={12} dir="row" align="center" justify="space-between" wrap>
          <span>{lastError}</span>
          <Button variant="ghost" size="sm" onClick={() => void load(sort)}>Retry</Button>
        </Stack>
      </Alert>
    );
  }
  if (applicants.length === 0) {
    return <EmptyState title="No applications yet" description="Share your apply URL to start receiving applications." />;
  }

  return (
    <Stack gap={12}>
      <Stack gap={16} dir="row" align="center" wrap>
        <div style={{ maxWidth: 240 }}>
          <Select aria-label="Sort applicants" value={sort} options={SORT_OPTIONS} onChange={(event) => setSort(event.target.value as ApplicantSort)} />
        </div>
        {allowArchive && (
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: '0.8125rem', color: 'var(--ink-muted)', cursor: 'pointer' }}>
            <input
              type="checkbox" checked={allSelected} aria-label="Select all applicants on this page"
              ref={(el) => { if (el) el.indeterminate = someSelected && !allSelected; }}
              onChange={handleTogglePage}
            />
            Select all
          </label>
        )}
      </Stack>
      <RankedFilterBar value={filterState} stages={stages} onChange={setFilterState} />
      {filteredApplicants.length === 0 ? (
        <EmptyState title="No applicants match these filters"
          description="Try a different search term, or clear the filters to see everyone."
          action={{ label: 'Clear filters', onClick: () => setFilterState(createInitialRankedFilterState()) }} />
      ) : (
        <Card padding="sm"><Table columns={columns} data={filteredApplicants} /></Card>
      )}
      {allowArchive && (
        <>
          <BulkArchiveBar
            selectedCount={selectedIds.size}
            onClear={() => setSelectedIds(new Set())}
            onArchive={() => setIsDialogOpen(true)}
            isSubmitting={isSubmitting}
          />
          <BulkArchiveDialog
            open={isDialogOpen}
            selectedCount={selectedIds.size}
            reasons={reasons}
            isSubmitting={isSubmitting}
            onCancel={() => setIsDialogOpen(false)}
            onConfirm={handleConfirmArchive}
          />
        </>
      )}
    </Stack>
  );
}
