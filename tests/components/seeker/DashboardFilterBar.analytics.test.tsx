import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';

const capture = vi.fn();
vi.mock('@/lib/posthog', () => ({ getPostHogClient: () => ({ capture }) }));

import DashboardFilterBar from '@/components/seeker/DashboardFilterBar';

function renderBar() {
  return render(
    <DashboardFilterBar
      roleCategoryFilter="all" experienceBandFilter="all" workplaceFilter="all" dateFilter="all"
      sel="" cos="" roleOptions={[{ value: 'all', label: 'All roles' }]}
      experienceOptions={[{ value: 'all', label: 'All exp' }]} desktopSelectStyle={{}}
      setRoleCategoryFilter={vi.fn()} setExperienceBandFilter={vi.fn()} setWorkplaceFilter={vi.fn()}
      setDateFilter={vi.fn()} setSel={vi.fn()} setCos={vi.fn()} setSp={vi.fn()}
    />,
  );
}

describe('Funnel 2 — jobs_filter_applied', () => {
  beforeEach(() => vi.clearAllMocks());

  it('fires action="added" when a workplace filter is chosen', () => {
    const { getByDisplayValue } = renderBar();
    fireEvent.change(getByDisplayValue('All workplaces'), { target: { value: 'remote' } });
    expect(capture).toHaveBeenCalledWith('jobs_filter_applied', { filterType: 'wp', action: 'added' });
  });

  it('fires action="removed" when a filter is reset to all', () => {
    const { getByDisplayValue } = renderBar();
    fireEvent.change(getByDisplayValue('Any time'), { target: { value: 'all' } });
    expect(capture).toHaveBeenCalledWith('jobs_filter_applied', { filterType: 'date', action: 'removed' });
  });
});
