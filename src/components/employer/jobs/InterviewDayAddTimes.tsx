'use client';
// FILE: src/components/employer/jobs/InterviewDayAddTimes.tsx
// The add-flow inside the day detail panel: "Select times to add" chip grid,
// custom-time escape hatch, and the footer (count · IST note · Add N). Each
// added time snapshots the panel's per-date meeting link (video mode); an
// empty link is sent as null, and the backend falls back to the posting
// default — or stores no link at all, which is a valid draft state.

import { useState } from 'react';
import { Button, Stack, useToast } from '@/components/ui';
import { addInterviewTimes, EmployerInterviewTimesApiError } from '@/api/employer-interview-times-api';
import { istLocalToUtcIso } from '@/utils/ist-datetime';
import type { InterviewMode } from '@/types/employer-interviews';
import { buildTimeChips, type ExistingPoolTime } from './time-chip-helpers';
import TimeChipGrid from './TimeChipGrid';

const INPUT_STYLE = {
  padding: '6px 9px', border: '0.5px solid var(--border)', borderRadius: 8,
  fontSize: 12, background: 'var(--surface-raised)', color: 'var(--ink)',
} as const;

export default function InterviewDayAddTimes({
  postingId, dateIso, durationMinutes, mode, defaultsSaved, meetingLink, existingTimes, onAdded,
}: {
  postingId: string;
  dateIso: string;
  durationMinutes: number;
  mode: InterviewMode;
  defaultsSaved: boolean;
  meetingLink: string;
  existingTimes: ExistingPoolTime[];
  onAdded: () => Promise<void>;
}) {
  const { showToast } = useToast();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [customOpen, setCustomOpen] = useState(false);
  const [customValue, setCustomValue] = useState('');
  const [busy, setBusy] = useState(false);
  const [warningDismissed, setWarningDismissed] = useState(false);

  const chips = buildTimeChips(dateIso, durationMinutes, existingTimes);
  const isVideo = mode === 'video';
  const trimmedLink = meetingLink.trim();
  // A missing link is a WARNING, never a blocker: times can be drafted now and
  // the link added later (per date, or as a posting default).
  const showMissingLinkWarning = isVideo && !trimmedLink && !warningDismissed;
  const selectedCount = selected.size;

  function toggle(istLocal: string): void {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(istLocal)) next.delete(istLocal); else next.add(istLocal);
      return next;
    });
  }

  function addCustomTime(): void {
    const utcIso = istLocalToUtcIso(customValue);
    if (!utcIso || new Date(utcIso) <= new Date()) {
      showToast('error', 'Pick a future date and time.');
      return;
    }
    toggle(customValue);
    setCustomValue('');
    setCustomOpen(false);
  }

  async function handleAdd(): Promise<void> {
    if (busy || selectedCount === 0 || !defaultsSaved) return;
    setBusy(true);
    try {
      const { insertedCount } = await addInterviewTimes(postingId, [...selected].map((value) => ({
        startAtUtc: istLocalToUtcIso(value) as string,
        // Empty → null so the backend can fall back to the posting default.
        meetingUrl: isVideo ? trimmedLink || null : null,
      })));
      showToast('success', `${insertedCount} time${insertedCount === 1 ? '' : 's'} added.`);
      setSelected(new Set());
      await onAdded();
    } catch (caught) {
      showToast('error', caught instanceof EmployerInterviewTimesApiError ? caught.message : 'Could not add times. Try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Stack gap={8}>
      <p style={{ margin: 0, fontSize: 12, letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--ink-2)' }}>
        Select times to add
      </p>
      <TimeChipGrid chips={chips} selectedIstLocals={selected} onToggle={toggle} />
      {customOpen && (
        <Stack dir="row" gap={8} align="center">
          <input type="datetime-local" aria-label="Custom time" value={customValue} style={INPUT_STYLE} onChange={(event) => setCustomValue(event.target.value)} />
          <Button variant="ghost" size="sm" onClick={addCustomTime}>Add to selection</Button>
        </Stack>
      )}
      {showMissingLinkWarning && (
        <div
          role="status"
          style={{
            display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 10px', borderRadius: 8,
            background: 'var(--warning-soft)', fontSize: 11, color: 'var(--warning)',
          }}
        >
          <span style={{ flex: 1 }}>
            No meeting link — candidates won&apos;t receive a video link until you add one.
          </span>
          <button
            type="button"
            onClick={() => setWarningDismissed(true)}
            style={{ border: 0, background: 'transparent', padding: 0, cursor: 'pointer', color: 'inherit', fontFamily: 'inherit', fontSize: 11 }}
          >
            Dismiss
          </button>
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>
          {selectedCount} time{selectedCount === 1 ? '' : 's'} selected
        </span>
        <span style={{ fontSize: 11, color: 'var(--ink-faint)' }}>Times in IST</span>
        <span style={{ flex: 1 }} />
        {!customOpen && <Button variant="link" size="sm" onClick={() => setCustomOpen(true)}>Custom time</Button>}
        {/* Gated ONLY on saved defaults (type + duration) — never on the link. */}
        <Button size="sm" loading={busy} disabled={busy || !defaultsSaved || selectedCount === 0} onClick={() => void handleAdd()}>
          Add {selectedCount > 0 ? selectedCount : ''} time{selectedCount === 1 ? '' : 's'}
        </Button>
      </div>
    </Stack>
  );
}
