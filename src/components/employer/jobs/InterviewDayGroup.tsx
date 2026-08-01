'use client';
// FILE: src/components/employer/jobs/InterviewDayGroup.tsx
// One collapsible date card: rows with hairline separators, cancelled rows
// behind "Show N cancelled", and a one-click "+ Add more times to this date".
// Every row gets the date's majority link so variant links render highlighted.

import { useState } from 'react';
import { ChevronDown, ChevronUp, Plus } from 'lucide-react';
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

  // Most rows share one link; only rows that DIFFER from the date's most
  // common link get highlighted by the row component.
  const linkCounts = new Map<string, number>();
  for (const time of group.activeTimes) {
    if (time.meetingUrl) linkCounts.set(time.meetingUrl, (linkCounts.get(time.meetingUrl) ?? 0) + 1);
  }
  const majorityLink = [...linkCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  return (
    <div
      data-testid={`day-group-${group.dateIso}`}
      style={{
        background: 'var(--surface-sunken)', border: '0.5px solid var(--border)',
        borderRadius: 12, padding: '12px 16px', marginBottom: 12, width: '100%',
      }}
    >
      <button
        type="button"
        aria-expanded={expanded}
        onClick={() => setExpanded((current) => !current)}
        style={{ display: 'flex', width: '100%', alignItems: 'center', gap: 8, background: 'none', border: 0, padding: 0, cursor: 'pointer' }}
      >
        <span style={{ flex: 1, textAlign: 'left', fontSize: 14, fontWeight: 500, color: 'var(--ink)' }}>{group.heading}</span>
        {expanded ? <ChevronUp size={16} style={{ color: 'var(--ink-muted)' }} /> : <ChevronDown size={16} style={{ color: 'var(--ink-muted)' }} />}
      </button>

      {expanded && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 10 }}>
          {group.activeTimes.map((time, index) => (
            <InterviewTimeRow
              key={time.id}
              time={time}
              onRemove={onRemove}
              withSeparator={index < group.activeTimes.length - 1 || (showCancelled && cancelledCount > 0)}
              majorityLink={majorityLink}
            />
          ))}
          {showCancelled && group.cancelledTimes.map((time, index) => (
            <InterviewTimeRow key={time.id} time={time} onRemove={onRemove} withSeparator={index < group.cancelledTimes.length - 1} />
          ))}
          <div style={{ display: 'flex', gap: 12, marginTop: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            <Button variant="link" size="sm" onClick={() => onAddMoreToDate(group.dateIso)}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--accent)' }}>
                <Plus size={12} /> Add more times to this date
              </span>
            </Button>
            {cancelledCount > 0 && (
              <Button variant="link" size="sm" onClick={() => setShowCancelled((current) => !current)}>
                <span style={{ fontSize: 12, color: 'var(--ink-2)' }}>
                  {showCancelled ? 'Hide cancelled' : `Show ${cancelledCount} cancelled`}
                </span>
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
