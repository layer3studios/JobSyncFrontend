'use client';
// FILE: src/components/seeker/dashboard/useDashboardFilters.ts
// Owns all filter state. Syncs writes to the URL via setSp.

import { useState, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { trackEvent } from '../../../lib/analytics-events';

type DiscoveryFilter = 'company' | 'role' | 'exp' | 'wp' | 'date';
const emitRemoved = (filterType: DiscoveryFilter) =>
  trackEvent('jobs_filter_applied', { filterType, action: 'removed' });

export function useDashboardFilters() {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const setSp = useCallback((fn: (sp: URLSearchParams) => void) => {
    const next = new URLSearchParams(Array.from(sp.entries()));
    fn(next);
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }, [sp, pathname, router]);

  const sel = sp.get('company') || '';
  const selectedJobParam = sp.get('selectedJob') || '';
  const [roleCategoryFilter, setRoleCategoryFilter] = useState(sp.get('role') || 'all');
  const [experienceBandFilter, setExperienceBandFilter] = useState(sp.get('exp') || 'all');
  const [workplaceFilter, setWorkplaceFilter] = useState(sp.get('wp') || 'all');
  const [dateFilter, setDateFilter] = useState(sp.get('date') || 'all');
  const [entryLevelFilter, setEntryLevelFilter] = useState(sp.get('entry') === '1');
  const [hideApplied, setHideApplied] = useState(sp.get('hideApplied') === '1');
  const [showNewOnly, setShowNewOnly] = useState(sp.get('newOnly') === '1');
  const [searchInput, setSearchInput] = useState(sp.get('q') || '');
  const [sortByMatch, setSortByMatch] = useState(sp.get('sort') === 'match');

  const activeFilters = [
    sel ? { label: sel, clear: () => { emitRemoved('company'); setSp(p => { p.delete('company'); }); } } : null,
    roleCategoryFilter !== 'all' ? { label: roleCategoryFilter, clear: () => { emitRemoved('role'); setRoleCategoryFilter('all'); setSp(p => { p.delete('role'); }); } } : null,
    experienceBandFilter !== 'all' ? { label: experienceBandFilter, clear: () => { emitRemoved('exp'); setExperienceBandFilter('all'); setSp(p => { p.delete('exp'); }); } } : null,
    workplaceFilter !== 'all' ? { label: workplaceFilter, clear: () => { emitRemoved('wp'); setWorkplaceFilter('all'); setSp(p => { p.delete('wp'); }); } } : null,
    dateFilter !== 'all' ? { label: dateFilter, clear: () => { emitRemoved('date'); setDateFilter('all'); setSp(p => { p.delete('date'); }); } } : null,
  ].filter(Boolean) as { label: string; clear: () => void }[];

  const clearAll = () => {
    setRoleCategoryFilter('all');
    setExperienceBandFilter('all');
    setWorkplaceFilter('all');
    setDateFilter('all');
    setEntryLevelFilter(false);
    setHideApplied(false);
    setShowNewOnly(false);
    setSearchInput('');
    router.replace(pathname);
  };

  return {
    sp, setSp,
    sel, selectedJobParam,
    roleCategoryFilter, setRoleCategoryFilter,
    experienceBandFilter, setExperienceBandFilter,
    workplaceFilter, setWorkplaceFilter,
    dateFilter, setDateFilter,
    entryLevelFilter, setEntryLevelFilter,
    hideApplied, setHideApplied,
    showNewOnly, setShowNewOnly,
    searchInput, setSearchInput,
    sortByMatch, setSortByMatch,
    activeFilters, clearAll,
  };
}
