'use client';
// FILE: src/components/seeker/dashboard/useDashboardJobs.ts
import { useState, useEffect, useCallback } from 'react';
import type { IJob } from '../../../types';
import { PAGE_SIZE } from './constants';

interface FilterParams {
  sel: string;
  roleCategoryFilter: string;
  experienceBandFilter: string;
  entryLevelFilter: boolean;
  workplaceFilter: string;
  dateFilter: string;
  debouncedSearch: string;
}

/** Owns the jobs array, pagination state, and the server fetch. */
export function useDashboardJobs(filters: FilterParams) {
  const [jobs, setJobs] = useState<IJob[]>([]);
  const [totalJobs, setTotalJobs] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchJobs = useCallback(async (pageNum: number, append: boolean) => {
    if (append) setLoadingMore(true);
    else { setLoading(true); setCurrentPage(1); }
    try {
      const p = new URLSearchParams({ page: String(pageNum), limit: String(PAGE_SIZE) });
      if (filters.sel) p.set('company', filters.sel);
      if (filters.roleCategoryFilter !== 'all') p.set('roleCategory', filters.roleCategoryFilter);
      if (filters.experienceBandFilter !== 'all') p.set('experienceBand', filters.experienceBandFilter);
      if (filters.entryLevelFilter || filters.experienceBandFilter === 'Fresher (0-1y)') p.set('entryLevel', 'true');
      if (filters.workplaceFilter !== 'all') p.set('workplace', filters.workplaceFilter);
      if (filters.dateFilter !== 'all') p.set('date', filters.dateFilter);
      if (filters.debouncedSearch.length >= 2) p.set('search', filters.debouncedSearch);

      const r = await fetch(`/api/seeker/jobs?${p}`, { credentials: 'include' });
      const d = await r.json() as { jobs?: IJob[]; totalJobs?: number; totalPages?: number; currentPage?: number };
      setTotalJobs(d.totalJobs ?? 0);
      setTotalPages(d.totalPages ?? 1);
      setCurrentPage(d.currentPage ?? pageNum);
      const newJobs = d.jobs ?? [];
      setJobs(prev => append ? [...prev, ...newJobs] : newJobs);
    } catch (e) { console.error(e); }
    finally { if (append) setLoadingMore(false); else setLoading(false); }
  }, [filters.sel, filters.roleCategoryFilter, filters.experienceBandFilter, filters.entryLevelFilter,
      filters.workplaceFilter, filters.dateFilter, filters.debouncedSearch]);

  useEffect(() => { fetchJobs(1, false); }, [fetchJobs]);

  return { jobs, setJobs, totalJobs, totalPages, currentPage, loading, loadingMore, fetchJobs };
}
