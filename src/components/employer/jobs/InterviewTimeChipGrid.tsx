'use client';
// FILE: src/components/employer/jobs/InterviewTimeChipGrid.tsx
// The add-times workspace. Heading names the working date ("Add times for
// Sat, 2 August 2026"); arrows step a day at a time; a date change flashes the
// picker and fades the grid in (CSS only). The meeting-link note above the
// picker is the honest v1: all new times snapshot the link saved in details —
// [Update link] jumps there. Per-time links are a later backend enhancement.

import { useState } from 'react';
import { Button, Stack, useToast } from '@/components/ui';
import { addInterviewTimes, EmployerInterviewTimesApiError } from '@/api/employer-interview-times-api';
import { istLocalToUtcIso, utcIsoToIstLocal } from '@/utils/ist-datetime';
import { formatInterviewDayHeading } from '@/utils/format-interview-time';
import { buildTimeChips, type ExistingPoolTime } from './time-chip-helpers';
import TimeChipGrid from './TimeChipGrid';

const INPUT_STYLE = {
  padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 8,
  fontSize: '0.9rem', background: 'var(--surface-raised)', color: 'var(--ink)',
} as const;
const MUTED = { margin: 0, fontSize: '0.78rem', color: 'var(--ink-muted)' } as const;

const truncateLink = (url: string) => (url.length > 40 ? `${url.slice(0, 40)}…` : url);
const stepDate = (dateIso: string, days: number) =>
  new Date(new Date(`${dateIso}T00:00:00Z`).getTime() + days * 86400000).toISOString().slice(0, 10);
/** Heading for an IST calendar day (noon avoids any boundary ambiguity). */
const dayHeading = (dateIso: string) => {
  const utcIso = istLocalToUtcIso(`${dateIso}T12:00`);
  return utcIso ? formatInterviewDayHeading(utcIso) : dateIso;
};

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
  const onThisDate = existingTimes.filter((time) => utcIsoToIstLocal(time.startAtUtc).slice(0, 10) === selectedDate);
  const availableHere = onThisDate.filter((time) => time.status === 'available').length;
  const bookedHere = onThisDate.filter((time) => time.status === 'booked').length;
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
      {/* CSS-only feedback: the picker flashes and the grid fades on date change. */}
      <style>{`
        @keyframes chipDateFlash { 0% { box-shadow: 0 0 0 3px var(--accent); } 100% { box-shadow: 0 0 0 0 transparent; } }
        @keyframes chipGridFade { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
      <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: 'var(--ink)' }}>
        Add times for {dayHeading(selectedDate)}
      </p>
      {meetingUrl && (
        <Stack gap={2}>
          <p style={MUTED}>Meeting link: {truncateLink(meetingUrl)}</p>
          <p style={MUTED}>ℹ All times use the link saved in interview details. Need a different link? Update it before adding times.</p>
          <div><Button variant="link" size="sm" onClick={onFocusMeetingLink}>Update link</Button></div>
        </Stack>
      )}
      <Stack dir="row" gap={6} align="center">
        <Button variant="ghost" size="sm" aria-label="Previous day" onClick={() => onDateChange(stepDate(selectedDate, -1))}>◀</Button>
        <input
          key={selectedDate}
          type="date"
          aria-label="Pick a date"
          value={selectedDate}
          style={{ ...INPUT_STYLE, animation: 'chipDateFlash 1s ease-out' }}
          onChange={(event) => onDateChange(event.target.value)}
        />
        <Button variant="ghost" size="sm" aria-label="Next day" onClick={() => onDateChange(stepDate(selectedDate, 1))}>▶</Button>
      </Stack>
      {onThisDate.length > 0 && (
        <p style={MUTED}>
          {onThisDate.length} time{onThisDate.length === 1 ? '' : 's'} already on this date ({availableHere} available, {bookedHere} booked)
        </p>
      )}
      <div key={`grid-${selectedDate}`} style={{ animation: 'chipGridFade 150ms ease-in' }}>
        <TimeChipGrid chips={chips} selectedIstLocals={selectedIstLocals} onToggle={toggleChip} />
      </div>
      <p style={MUTED}>Times are in India Standard Time (IST).</p>
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
      {!defaultsSaved && <p style={MUTED}>Save interview details first.</p>}
      <div>
        <Button size="sm" loading={busy} disabled={busy || !defaultsSaved || selectedCount === 0} onClick={() => void handleAddAll()}>
          {selectedCount > 0 ? `Add ${selectedCount} time${selectedCount === 1 ? '' : 's'}` : 'Add times'}
        </Button>
      </div>
    </Stack>
  );
}
