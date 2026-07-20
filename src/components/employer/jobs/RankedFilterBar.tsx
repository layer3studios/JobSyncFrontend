'use client';
// FILE: src/components/employer/jobs/RankedFilterBar.tsx
// Client-side filter controls for the Ranked tab: debounced name/email search, stage
// chips, score-tier chips (plus an "Unscored" pseudo-tier), and an archived toggle.
// Every chip is a multi-select toggle — empty selection means "all" (R1).
//
// Search is debounced locally so a keystroke never re-filters the table (R2); the
// parent only sees settled search text. There is no shared useDebouncedValue hook in
// this repo, so the pattern is inlined here rather than creating one out of scope.

import { useEffect, useState } from 'react';
import { Button, Input, Stack, Switch } from '@/components/ui';
import {
  createInitialRankedFilterState, isRankedFilterActive, toggleSetValue, SCORE_FILTER_VALUES,
} from '@/components/employer/jobs/ranked-filter-helpers';
import type { RankedFilterState, ScoreFilterValue } from '@/components/employer/jobs/ranked-filter-helpers';
import type { Stage } from '@/types/employer-applicants';

const SEARCH_DEBOUNCE_MILLISECONDS = 200;
const SEARCH_PLACEHOLDER = 'Search name or email';

/** Chip accent per score value; 'unscored' stays deliberately muted. */
const CHIP_COLOR: Record<ScoreFilterValue, string> = {
  strong: 'var(--success)', good: 'var(--accent)', partial: 'var(--warning)',
  weak: 'var(--ink-muted)', poor: 'var(--ink-muted)', unscored: 'var(--ink-faint)',
};
const SCORE_CHIP_LABEL: Record<ScoreFilterValue, string> = {
  strong: 'Strong', good: 'Good', partial: 'Partial',
  weak: 'Weak', poor: 'Poor', unscored: 'Unscored',
};

/**
 * A toggleable filter pill. Rendered as a real <button> with aria-pressed so the
 * on/off state is announced and testable, rather than a clickable Badge <span>.
 */
function FilterChip({ label, isActive, accent, onToggle }: {
  label: string; isActive: boolean; accent: string; onToggle: () => void;
}) {
  return (
    <button
      type="button" aria-pressed={isActive} onClick={onToggle}
      style={{
        cursor: 'pointer', borderRadius: 999, padding: '3px 11px', fontSize: '0.75rem', fontWeight: 600,
        border: `1px solid ${isActive ? accent : 'var(--border)'}`,
        background: isActive ? accent : 'transparent',
        color: isActive ? 'var(--text-on-accent)' : 'var(--ink-muted)',
      }}
    >
      {label}
    </button>
  );
}

function ChipRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
      <span style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--ink-faint)', minWidth: 46 }}>
        {label}
      </span>
      {children}
    </div>
  );
}

export default function RankedFilterBar({ value, stages, onChange }: {
  value: RankedFilterState;
  stages: Stage[];
  onChange: (next: RankedFilterState) => void;
}) {
  const [localSearch, setLocalSearch] = useState(value.searchText);

  // Settle the keystrokes, then lift. Guarded so a parent-driven reset (Clear filters)
  // does not immediately echo back an identical onChange.
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== value.searchText) onChange({ ...value, searchText: localSearch });
    }, SEARCH_DEBOUNCE_MILLISECONDS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localSearch]);

  // Keep the input in step when the parent resets the state out from under us.
  useEffect(() => {
    if (value.searchText === '') setLocalSearch('');
  }, [value.searchText]);

  const handleToggleStage = (stageId: string) =>
    onChange({ ...value, stageIds: toggleSetValue(value.stageIds, stageId) });

  const handleToggleScore = (scoreValue: ScoreFilterValue) =>
    onChange({ ...value, scoreValues: toggleSetValue(value.scoreValues, scoreValue) });

  const handleClearFilters = () => {
    setLocalSearch('');
    onChange(createInitialRankedFilterState());
  };

  return (
    <Stack gap={10}>
      <Stack gap={12} dir="row" align="center" wrap>
        <div style={{ maxWidth: 320, flex: 1, minWidth: 200 }}>
          <Input
            aria-label={SEARCH_PLACEHOLDER} placeholder={SEARCH_PLACEHOLDER}
            value={localSearch} onChange={(event) => setLocalSearch(event.target.value)}
          />
        </div>
        <Switch
          label="Include archived" checked={value.includeArchived}
          onChange={(checked) => onChange({ ...value, includeArchived: checked })}
        />
        {isRankedFilterActive(value) && (
          <div style={{ marginLeft: 'auto' }}>
            <Button variant="ghost" size="sm" onClick={handleClearFilters}>Clear filters</Button>
          </div>
        )}
      </Stack>

      {stages.length > 0 && (
        <ChipRow label="Stage">
          {stages.map((stage) => (
            <FilterChip
              key={stage.id} label={stage.text} accent="var(--accent)"
              isActive={value.stageIds.has(stage.id)}
              onToggle={() => handleToggleStage(stage.id)}
            />
          ))}
        </ChipRow>
      )}

      <ChipRow label="Score">
        {SCORE_FILTER_VALUES.map((scoreValue) => (
          <FilterChip
            key={scoreValue} label={SCORE_CHIP_LABEL[scoreValue]} accent={CHIP_COLOR[scoreValue]}
            isActive={value.scoreValues.has(scoreValue)}
            onToggle={() => handleToggleScore(scoreValue)}
          />
        ))}
      </ChipRow>
    </Stack>
  );
}
