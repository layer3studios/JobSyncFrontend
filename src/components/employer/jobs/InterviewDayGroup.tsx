'use client';
// FILE: src/components/employer/jobs/InterviewDayGroup.tsx
// One collapsible date section: active rows, cancelled rows behind a
// "Show N cancelled" toggle (clutter control — the summary bar still counts
// them), and a one-click "+ Add more times to this date" that points the add
// panel's date picker at this date.

import { useState } from 'react';
import { Button } from '@/components/ui';
import type { InterviewDayGroupData } from './interview-time-grouping-helpers';
import InterviewTimeRow from './InterviewTimeRow';

export default function InterviewDayGroup({
  group, onRemove, onAddMoreToDate,
}: {
  group: InterviewDayGroupData;
  onRemove: (timeId: string) => void;
  onAddMoreToDate: (dateIso: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const [showCancelled, setShowCancelled] = useState(false);
  const cancelledCount = group.cancelledTimes.length;

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 12, padding: '12px 14px', width: '100%' }}>
      <button
        type="button"
        aria-expanded={expanded}
        onClick={() => setExpanded((current) => !current)}
        style={{ display: 'flex', width: '100%', alignItems: 'center', gap: 8, background: 'none', border: 0, padding: 0, cursor: 'pointer' }}
      >
        <span style={{ flex: 1, textAlign: 'left', fontSize: '0.9rem', fontWeight: 700, color: 'var(--ink)' }}>{group.heading}</span>
        <span aria-hidden style={{ color: 'var(--ink-muted)' }}>{expanded ? '▾' : '▸'}</span>
      </button>

      {expanded && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 10 }}>
          {group.activeTimes.map((time, index) => (
            <InterviewTimeRow
              key={time.id}
              time={time}
              onRemove={onRemove}
              withSeparator={index < group.activeTimes.length - 1 || showCancelled}
            />
          ))}
          {showCancelled && group.cancelledTimes.map((time, index) => (
            <InterviewTimeRow key={time.id} time={time} onRemove={onRemove} withSeparator={index < group.cancelledTimes.length - 1} />
          ))}
          <div style={{ display: 'flex', gap: 12, marginTop: 6, flexWrap: 'wrap' }}>
            <Button variant="link" size="sm" onClick={() => onAddMoreToDate(group.dateIso)}>
              + Add more times to this date
            </Button>
            {cancelledCount > 0 && (
              <Button variant="link" size="sm" onClick={() => setShowCancelled((current) => !current)}>
                {showCancelled ? 'Hide cancelled' : `Show ${cancelledCount} cancelled`}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
