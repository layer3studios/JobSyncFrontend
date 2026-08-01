'use client';
// FILE: src/components/employer/jobs/InterviewCalendarGrid.tsx
// The month view: nav arrows + label + colour legend, weekday header row, and
// the 7-column cell grid built from the pure month helper.

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui';
import type { InterviewTime } from '@/types/employer-interviews';
import { buildMonthGrid, monthLabel, stepMonth, WEEKDAY_LABELS } from './interview-calendar-helpers';
import InterviewCalendarCell from './InterviewCalendarCell';

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--ink-2)' }}>
      <span style={{ width: 5, height: 5, borderRadius: 999, background: color }} />
      {label}
    </span>
  );
}

export default function InterviewCalendarGrid({
  year, month, times, selectedDate, onSelectDate, onMonthChange,
}: {
  year: number;
  month: number;
  times: InterviewTime[];
  selectedDate: string | null;
  onSelectDate: (dateIso: string) => void;
  onMonthChange: (next: { year: number; month: number }) => void;
}) {
  const cells = buildMonthGrid(year, month, times);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <Button variant="ghost" size="sm" aria-label="Previous month" onClick={() => onMonthChange(stepMonth(year, month, -1))}>
          <ChevronLeft size={15} />
        </Button>
        <span style={{ fontSize: 15, fontWeight: 500, color: 'var(--ink)' }}>{monthLabel(year, month)}</span>
        <Button variant="ghost" size="sm" aria-label="Next month" onClick={() => onMonthChange(stepMonth(year, month, 1))}>
          <ChevronRight size={15} />
        </Button>
        <span style={{ marginLeft: 'auto', display: 'inline-flex', gap: 10 }}>
          <LegendDot color="#1D9E75" label="available" />
          <LegendDot color="var(--accent)" label="booked" />
          <LegendDot color="var(--ink-faint)" label="past" />
        </span>
      </div>

      <div style={{ background: 'var(--surface-sunken)', border: '0.5px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        <div role="row" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', background: 'var(--surface-raised)' }}>
          {WEEKDAY_LABELS.map((label) => (
            <span key={label} style={{ padding: '6px 0', textAlign: 'center', fontSize: 11, color: 'var(--ink-faint)' }}>{label}</span>
          ))}
        </div>
        <div data-testid="calendar-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {cells.map((cell) => (
            <InterviewCalendarCell
              key={cell.dateIso}
              cell={cell}
              isSelected={cell.dateIso === selectedDate}
              onSelect={onSelectDate}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
