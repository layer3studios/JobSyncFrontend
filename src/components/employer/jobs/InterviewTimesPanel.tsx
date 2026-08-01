'use client';
// FILE: src/components/employer/jobs/InterviewTimesPanel.tsx
// The right-side scheduling workspace: summary bar (+ pool-low banner),
// day-grouped time display, and the add-times chip grid at the bottom.
// "+ Add more times to this date" points the shared date picker at that day.

import { useRef } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Stack, Alert, useToast } from '@/components/ui';
import { removeInterviewTime, EmployerInterviewTimesApiError } from '@/api/employer-interview-times-api';
import type { InterviewTime } from '@/types/employer-interviews';
import { groupTimesByIstDate, summarizeTimes } from './interview-time-grouping-helpers';
import InterviewDayGroup from './InterviewDayGroup';
import InterviewTimeChipGrid from './InterviewTimeChipGrid';

export default function InterviewTimesPanel({
  postingId, times, refetch, defaultsSaved, durationMinutes, mode,
  meetingLink, onMeetingLinkChange, selectedDate, onDateChange,
}: {
  postingId: string;
  times: InterviewTime[];
  refetch: () => Promise<void>;
  defaultsSaved: boolean;
  durationMinutes: number;
  mode: import('@/types/employer-interviews').InterviewMode;
  meetingLink: string;
  onMeetingLinkChange: (value: string) => void;
  selectedDate: string;
  onDateChange: (dateIso: string) => void;
}) {
  const { showToast } = useToast();
  const addPanelRef = useRef<HTMLDivElement>(null);
  const summary = summarizeTimes(times);
  const groups = groupTimesByIstDate(times);

  /** "+ Add more times to this date": point the picker AND bring it into view. */
  function handleAddMoreToDate(dateIso: string): void {
    onDateChange(dateIso);
    addPanelRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
  }

  async function handleRemove(timeId: string): Promise<void> {
    try {
      await removeInterviewTime(postingId, timeId);
      await refetch();
    } catch (caught) {
      showToast('error', caught instanceof EmployerInterviewTimesApiError ? caught.message : 'Could not remove that time.');
    }
  }

  const summaryLine = [
    `${summary.total} time${summary.total === 1 ? '' : 's'} across ${summary.dayCount} day${summary.dayCount === 1 ? '' : 's'}`,
    `${summary.available} available`,
    `${summary.booked} booked`,
    `${summary.cancelled} cancelled`,
  ].join(' · ');

  return (
    <Stack gap={14}>
      {summary.total > 0 && (
        // Sticky: stays visible above the scrolling day groups.
        <p data-testid="times-summary-bar" style={{
          margin: 0, fontSize: 12, color: 'var(--ink-2)', position: 'sticky', top: 0,
          background: 'var(--surface-sunken)', borderBottom: '0.5px solid var(--border)',
          zIndex: 2, padding: '8px 0',
        }}>
          {summaryLine}
        </p>
      )}
      {defaultsSaved && summary.available <= 1 && (
        <Alert type="warning">
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={15} />
            {summary.available === 0
              ? 'No interview times available. Add more to keep scheduling.'
              : 'Only 1 interview time remaining. Add more to keep scheduling.'}
          </span>
        </Alert>
      )}

      {summary.total === 0 ? (
        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--ink-muted)' }}>
          No interview times yet. Pick a date below and tap times to get started. ↓
        </p>
      ) : (
        <Stack gap={10}>
          {groups.map((group) => (
            <InterviewDayGroup
              key={group.dateIso}
              group={group}
              onRemove={(timeId) => void handleRemove(timeId)}
              onAddMoreToDate={handleAddMoreToDate}
            />
          ))}
        </Stack>
      )}

      <div ref={addPanelRef} style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
        <InterviewTimeChipGrid
          postingId={postingId}
          durationMinutes={durationMinutes}
          defaultsSaved={defaultsSaved}
          mode={mode}
          meetingLink={meetingLink}
          onMeetingLinkChange={onMeetingLinkChange}
          existingTimes={times}
          selectedDate={selectedDate}
          onDateChange={onDateChange}
          onAdded={refetch}
        />
      </div>
    </Stack>
  );
}
