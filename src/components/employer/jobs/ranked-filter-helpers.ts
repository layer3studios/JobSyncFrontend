// FILE: src/components/employer/jobs/ranked-filter-helpers.ts
// Pure client-side filtering for the Ranked tab (T1.5). No React, no I/O, no clock —
// same input always yields the same output, so the whole thing is unit-testable in
// isolation. Every rule is AND-combined; an empty set on an axis means "all".
//
// 'unscored' is a UI-only pseudo-tier (R4): scoring is async and can fail terminally,
// and an employer chasing a stuck posting needs one chip meaning "the score is not
// usable" without caring whether that is a queue error or a null row.

import type { Applicant, ScoreTier } from '@/types/employer-applicants';

export type { ScoreTier };
export type ScoreFilterValue = ScoreTier | 'unscored';

/** Every tier chip, in descending quality order, plus the pseudo-tier. */
export const SCORE_FILTER_VALUES: readonly ScoreFilterValue[] = [
  'strong', 'good', 'partial', 'weak', 'poor', 'unscored',
];

export interface RankedFilterState {
  /** Raw user input; trimmed + lowercased inside the filter, never by the caller. */
  searchText: string;
  /** Empty = all stages. */
  stageIds: ReadonlySet<string>;
  /** Empty = all scores. */
  scoreValues: ReadonlySet<ScoreFilterValue>;
  includeArchived: boolean;
}

/** A fresh initial state. A factory, not a constant — the Sets must not be shared. */
export function createInitialRankedFilterState(): RankedFilterState {
  return { searchText: '', stageIds: new Set(), scoreValues: new Set(), includeArchived: false };
}

/** True when the employer has narrowed the list in any way (drives "Clear filters"). */
export function isRankedFilterActive(state: RankedFilterState): boolean {
  return state.searchText.trim() !== ''
    || state.stageIds.size > 0
    || state.scoreValues.size > 0
    || state.includeArchived;
}

/** Immutable add/remove of one value — the toggle primitive behind every chip (R1). */
export function toggleSetValue<T>(source: ReadonlySet<T>, value: T): Set<T> {
  const next = new Set(source);
  if (next.has(value)) next.delete(value); else next.add(value);
  return next;
}

/**
 * Which score chip an applicant belongs to. A missing score, a terminal
 * processingError, or a null numeric score all collapse to 'unscored' (C8/R4).
 */
export function deriveScoreBucket(applicant: Applicant): ScoreFilterValue {
  const { score } = applicant;
  if (!score || score.processingError || score.score == null) return 'unscored';
  return score.tier;
}

/** Case-insensitive substring match over the contact's name and email (R5). */
function matchesSearch(applicant: Applicant, needle: string): boolean {
  const { contact } = applicant;
  if (!contact) return false; // no contact → nothing to match against
  const haystack = `${contact.fullName ?? ''} ${contact.email ?? ''}`.toLowerCase();
  return haystack.includes(needle);
}

/**
 * Apply every active filter axis to the fetched list. Returns a new array; the input
 * is never mutated. Rule order does not affect the result — all rules are AND-ed.
 */
export function filterRankedApplicants(
  applicants: Applicant[],
  state: RankedFilterState,
): Applicant[] {
  const needle = state.searchText.trim().toLowerCase();

  return applicants.filter((applicant) => {
    if (!state.includeArchived && applicant.application.archived != null) return false;
    if (state.stageIds.size > 0 && !state.stageIds.has(applicant.application.stageId)) return false;
    if (state.scoreValues.size > 0 && !state.scoreValues.has(deriveScoreBucket(applicant))) return false;
    if (needle !== '' && !matchesSearch(applicant, needle)) return false;
    return true;
  });
}
