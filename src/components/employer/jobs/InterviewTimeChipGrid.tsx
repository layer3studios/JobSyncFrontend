'use client';
// FILE: src/components/employer/jobs/InterviewTimeChipGrid.tsx
// The add-times workspace: date picker → chip grid → one "Add all" POST.
// Selection accumulates across dates; a "Custom time" escape hatch covers
// off-grid times. All values are IST wall-clock, converted to UTC on send.
// New times inherit the saved meeting link (read-only line — "Change in
// details" jumps to the defaults form input); per-time links are a later
// backend enhancement.

import { useState } from 'react';
import { Button, Stack, useToast } from '@/components/ui';
import { addInterviewTimes, EmployerInterviewTimesApiError } from '@/api/employer-interview-times-api';
import { istLocalToUtcIso } from '@/utils/ist-datetime';
import { buildTimeChips, type ExistingPoolTime } from './time-chip-helpers';
import TimeChipGrid from './TimeChipGrid';

const INPUT_STYLE = {
  padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 8,
  fontSize: '0.9rem', background: 'var(--surface-raised)', color: 'var(--ink)',
} as const;

const truncateLink = (url: string) => (url.length > 28 ? `${url.slice(0, 28)}…` : url);

export default function InterviewTimeChipGrid({
  postingId, durationMinutes, defaultsSaved, meetingUrl, existingTimes,
  selectedDate, onDateChange, onFocusMeetingLink, onAdded,
}: {
  postingId: string;
  durationMinutes: number;
  defaultsSaved: boolean;
  meetingUrl: string | null;
  existingTimes: ExistingPoolTime[];
  selectedDate: string;
  onDateChange: (dateIso: string) => void;
  onFocusMeetingLink: () => void;
  onAdded: () => Promise<void>;
}) {
  const { showToast } = useToast();
  const [selectedIstLocals, setSelectedIstLocals] = useState<Set<string>>(new Set());
  const [customOpen, setCustomOpen] = useState(false);
  const [customValue, setCustomValue] = useState('');
  const [busy, setBusy] = useState(false);

  const chips = buildTimeChips(selectedDate, durationMinutes, existingTimes);
  const onThisDate = chips.filter((chip) => chip.alreadyAdded).length;
  const selectedCount = selectedIstLocals.size;
  const dayCount = new Set([...selectedIstLocals].map((value) => value.slice(0, 10))).size;

  function toggleChip(istLocal: string): void {
    setSelectedIstLocals((current) => {
      const next = new Set(current);
      if (next.has(istLocal)) next.delete(istLocal);
      else next.add(istLocal);
      return next;
    });
  }

  function addCustomTime(): void {
    const utcIso = istLocalToUtcIso(customValue);
    if (!utcIso || new Date(utcIso) <= new Date()) {
      showToast('error', 'Pick a future date and time.');
      return;
    }
    toggleChip(customValue);
    setCustomValue('');
    setCustomOpen(false);
  }

  async function handleAddAll(): Promise<void> {
    if (busy || selectedCount === 0 || !defaultsSaved) return;
    setBusy(true);
    try {
      const { insertedCount } = await addInterviewTimes(postingId, [...selectedIstLocals].map((value) => ({
        startAtUtc: istLocalToUtcIso(value) as string,
      })));
      showToast('success', `${insertedCount} time${insertedCount === 1 ? '' : 's'} added.`);
      setSelectedIstLocals(new Set());
      await onAdded();
    } catch (caught) {
      showToast('error', caught instanceof EmployerInterviewTimesApiError ? caught.message : 'Could not add times. Try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Stack gap={10}>
      <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600, color: 'var(--ink)' }}>Add times</p>
      {meetingUrl && (
        <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--ink-muted)' }}>
          Link: {truncateLink(meetingUrl)} ·{' '}
          <Button variant="link" size="sm" onClick={onFocusMeetingLink}>Change in details</Button>
        </p>
      )}
      <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.8rem', color: 'var(--ink-muted)', maxWidth: 220 }}>
        Pick a date
        <input type="date" value={selectedDate} style={INPUT_STYLE} onChange={(event) => onDateChange(event.target.value)} />
      </label>
      {onThisDate > 0 && (
        <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--ink-muted)' }}>
          {onThisDate} time{onThisDate === 1 ? '' : 's'} already on this date
        </p>
      )}
      <TimeChipGrid chips={chips} selectedIstLocals={selectedIstLocals} onToggle={toggleChip} />
      <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--ink-muted)' }}>Times are in India Standard Time (IST).</p>
      {selectedCount > 0 && (
        <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: 600, color: 'var(--ink)' }}>
          {selectedCount} time{selectedCount === 1 ? '' : 's'} selected across {dayCount} day{dayCount === 1 ? '' : 's'}
        </p>
      )}
      {customOpen ? (
        <Stack dir="row" gap={8} align="center">
          <input type="datetime-local" aria-label="Custom time" value={customValue} style={INPUT_STYLE} onChange={(event) => setCustomValue(event.target.value)} />
          <Button variant="ghost" size="sm" onClick={addCustomTime}>Add to selection</Button>
        </Stack>
      ) : (
        <div><Button variant="link" size="sm" onClick={() => setCustomOpen(true)}>Custom time</Button></div>
      )}
      {!defaultsSaved && (
        <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--ink-muted)' }}>Save interview details first.</p>
      )}
      <div>
        <Button size="sm" loading={busy} disabled={busy || !defaultsSaved || selectedCount === 0} onClick={() => void handleAddAll()}>Add all</Button>
      </div>
    </Stack>
  );
}
