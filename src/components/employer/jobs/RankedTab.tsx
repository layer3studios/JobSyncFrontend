'use client';
// FILE: src/components/employer/jobs/RankedTab.tsx
// Ranked view: 220px filter sidebar + candidate table. State, API calls and
// URL sync are identical to the old chip layout — visual restructure only.
// Below 768px the sidebar collapses into a Drawer (RankedMobileFilters).

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Button, Alert, Stack, EmptyState, SkeletonCard } from '@/components/ui';
import {
  listApplicantsForPosting, listStages, listArchiveReasons,
  fetchApplicantFacets, EmployerApplicantsApiError,
} from '@/api/employer-applicants-api';
import type { Applicant, ApplicantFacets, ArchiveReason, SavedView, Stage, ApplicantSort } from '@/types/employer-applicants';
import {
  filterRankedApplicants, createInitialRankedFilterState, toggleSetValue,
  createInitialServerFilterState, isServerFilterActive, serverFiltersToQuery,
  readServerFiltersFromSearchParams, writeServerFiltersToSearchParams,
  serverFiltersToViewPayload, serverFiltersFromViewPayload,
} from './ranked-filter-helpers';
import type { RankedFilterState, ServerFilterState } from './ranked-filter-helpers';
import { deriveSidebarCounts, countAllActiveFilters } from './ranked-sidebar-helpers';
import { useIsNarrowViewport } from './useIsNarrowViewport';
import RankedFilterSidebar from './RankedFilterSidebar';
import RankedTableToolbar from './RankedTableToolbar';
import RankedCandidateTable from './RankedCandidateTable';
import RankedBulkActions from './RankedBulkActions';
import RankedMobileFilters from './RankedMobileFilters';
import SavedViewsRow from './SavedViewsRow';
import { useEmployer } from '@/context/employer/EmployerContext';
import { canBulkArchive } from '@/lib/team-permissions';
type LoadState = 'loading' | 'loaded' | 'error';
const LOAD_ERROR_MESSAGE = 'Could not load applicants.';

export default function RankedTab({ postingId }: { postingId: string }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const isNarrow = useIsNarrowViewport();

  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [reasons, setReasons] = useState<ArchiveReason[]>([]);
  const [facets, setFacets] = useState<ApplicantFacets>({ skills: [], cities: [] });
  const [sort, setSort] = useState<ApplicantSort>('score');
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [lastError, setLastError] = useState<string>(LOAD_ERROR_MESSAGE);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filterState, setFilterState] = useState<RankedFilterState>(createInitialRankedFilterState);
  const [serverFilters, setServerFilters] = useState<ServerFilterState>(
    () => readServerFiltersFromSearchParams(new URLSearchParams(searchParams?.toString() ?? '')),
  );
  const hasLoadedOnce = useRef(false);
  const { viewerRole, viewerCanArchiveApplicants, company } = useEmployer();
  const allowArchive = viewerRole ? canBulkArchive(viewerRole, viewerCanArchiveApplicants) : true;

  const load = useCallback(async (activeSort: ApplicantSort) => {
    setLoadState('loading');
    try {
      const [applicantsResult, stagesResult, reasonsResult] = await Promise.all([
        listApplicantsForPosting(postingId, { sort: activeSort, filters: serverFiltersToQuery(serverFilters) }),
        listStages(),
        listArchiveReasons(),
      ]);
      setApplicants(applicantsResult);
      setStages(stagesResult);
      setReasons(reasonsResult);
      const presentIds = new Set(applicantsResult.map((item) => item.application.id));
      setSelectedIds((prev) => new Set([...prev].filter((id) => presentIds.has(id))));
      hasLoadedOnce.current = true;
      setLoadState('loaded');
    } catch (error) {
      setLastError(error instanceof EmployerApplicantsApiError ? error.message : LOAD_ERROR_MESSAGE);
      setLoadState('error');
    }
  }, [postingId, serverFilters]);

  useEffect(() => {
    if (!hasLoadedOnce.current) { void load(sort); return; }
    const timer = setTimeout(() => { void load(sort); }, 300);
    return () => clearTimeout(timer);
  }, [load, sort]);

  useEffect(() => {
    let cancelled = false;
    fetchApplicantFacets(postingId)
      .then((result) => { if (!cancelled) setFacets(result); })
      .catch(() => { /* facet sections simply don't render counts */ });
    return () => { cancelled = true; };
  }, [postingId]);

  const handleServerFiltersChange = useCallback((next: ServerFilterState) => {
    setServerFilters(next);
    const params = new URLSearchParams(searchParams?.toString() ?? '');
    writeServerFiltersToSearchParams(next, params);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [searchParams, router, pathname]);

  const activePayloadJson = JSON.stringify(serverFiltersToViewPayload(serverFilters));
  const handleApplyView = useCallback((view: SavedView) => {
    handleServerFiltersChange(serverFiltersFromViewPayload(view.filters));
  }, [handleServerFiltersChange]);
  const isViewActive = useCallback((view: SavedView) =>
    JSON.stringify(serverFiltersToViewPayload(serverFiltersFromViewPayload(view.filters))) === activePayloadJson,
  [activePayloadJson]);

  const filteredApplicants = useMemo(
    () => filterRankedApplicants(applicants, filterState), [applicants, filterState],
  );

  // Sidebar counts derive from the loaded (server-filtered) list.
  const { stageCounts, scoreCounts } = useMemo(() => deriveSidebarCounts(applicants), [applicants]);
  const activeFilterCount = countAllActiveFilters(filterState, serverFilters);

  const clearAllFilters = () => {
    setFilterState(createInitialRankedFilterState());
    handleServerFiltersChange(createInitialServerFilterState());
  };

  const visibleIds = filteredApplicants.map((item) => item.application.id);
  const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));
  const someSelected = visibleIds.some((id) => selectedIds.has(id));
  const handleTogglePage = () => setSelectedIds((prev) => {
    if (!allSelected) return new Set([...prev, ...visibleIds]);
    return new Set([...prev].filter((id) => !visibleIds.includes(id)));
  });

  if (loadState === 'loading' && !hasLoadedOnce.current) return <SkeletonCard lines={5} />;
  const isRefetching = loadState === 'loading';
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
  if (applicants.length === 0 && !isServerFilterActive(serverFilters)) {
    return <EmptyState title="No applications yet" description="Share your apply URL to start receiving applications." />;
  }

  const sidebar = (
    <RankedFilterSidebar
      value={filterState} onChange={setFilterState}
      serverValue={serverFilters} onServerChange={handleServerFiltersChange}
      stages={stages} facets={facets} stageCounts={stageCounts} scoreCounts={scoreCounts}
    />
  );

  return (
    <Stack gap={12}>
      <SavedViewsRow
        postingId={postingId}
        isViewActive={isViewActive}
        canSave={isServerFilterActive(serverFilters)}
        onApply={handleApplyView}
        onSaveCurrent={() => serverFiltersToViewPayload(serverFilters)}
      />
      {isNarrow && <RankedMobileFilters activeFilterCount={activeFilterCount}>{sidebar}</RankedMobileFilters>}
      <div style={{ display: 'flex', alignItems: 'flex-start', width: '100%' }}>
        {!isNarrow && (
          <aside style={{ width: 220, flexShrink: 0, paddingRight: 16, borderRight: '0.5px solid var(--border)' }}>
            {sidebar}
          </aside>
        )}
        <div style={{ flex: 1, minWidth: 0, paddingLeft: isNarrow ? 0 : 16, opacity: isRefetching ? 0.55 : 1, transition: 'opacity 0.15s ease' }} aria-busy={isRefetching}>
          <RankedTableToolbar
            applicantCount={filteredApplicants.length}
            activeFilterCount={activeFilterCount}
            sort={sort} onSortChange={setSort}
            showSelect={allowArchive}
            allSelected={allSelected} someSelected={someSelected} onTogglePage={handleTogglePage}
          />
          <RankedCandidateTable
            applicants={filteredApplicants}
            postingId={postingId}
            stages={stages}
            showSelect={allowArchive}
            selectedIds={selectedIds}
            onToggleSelect={(id) => setSelectedIds((prev) => toggleSetValue(prev, id))}
            onClearFilters={clearAllFilters}
          />
        </div>
      </div>
      {allowArchive && (
        <RankedBulkActions
          postingId={postingId}
          companyId={company?.id}
          reasons={reasons}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          onArchived={() => void load(sort)}
        />
      )}
    </Stack>
  );
}
