'use client';
// FILE: src/components/employer/jobs/InterviewDetailsForm.tsx
// Left-panel interview details, pill-toggle edition: Type and Duration as
// one-of pill rows, then the mode field (link / phone / address) and a
// full-width Save. Saving PUTs the defaults; the saved link doubles as the
// prefill for the calendar's per-date link input.

import { useState } from 'react';
import { Button, useToast } from '@/components/ui';
import { updateInterviewDefaults, EmployerInterviewTimesApiError } from '@/api/employer-interview-times-api';
import type { InterviewDefaults, InterviewMode, PhoneCallDirection } from '@/types/employer-interviews';

const MODE_OPTIONS: { value: InterviewMode; label: string }[] = [
  { value: 'video', label: 'Video' }, { value: 'phone', label: 'Phone' }, { value: 'in_person', label: 'In person' },
];
const DIRECTION_OPTIONS: { value: PhoneCallDirection; label: string }[] = [
  { value: 'we_call', label: 'We call candidate' }, { value: 'candidate_calls', label: 'Candidate calls us' },
];
const DURATION_OPTIONS = [30, 45, 60, 90];
const LABEL_STYLE = { margin: '0 0 6px', fontSize: 12, letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--ink-2)' } as const;
const INPUT_STYLE = {
  width: '100%', padding: '6px 9px', border: '0.5px solid var(--border)', borderRadius: 8,
  fontSize: 12, background: 'var(--surface-raised)', color: 'var(--ink)',
} as const;
const DIVIDER = { borderTop: '0.5px solid var(--border)', margin: '14px 0' } as const;

function PillToggle({ label, selected, onSelect }: { label: string; selected: boolean; onSelect: () => void }) {
  return (
    <button
      type="button" aria-pressed={selected} onClick={onSelect}
      style={{
        padding: '4px 12px', borderRadius: 999, fontSize: 12, cursor: 'pointer',
        border: selected ? '0.5px solid var(--accent)' : '0.5px solid var(--border)',
        background: selected ? 'var(--accent)' : 'transparent',
        color: selected ? 'var(--text-on-accent)' : 'var(--ink)',
        fontWeight: selected ? 600 : 400,
      }}
    >
      {label}
    </button>
  );
}

export default function InterviewDetailsForm({
  postingId, initialDefaults, onSaved,
}: {
  postingId: string;
  initialDefaults: InterviewDefaults | null;
  onSaved: (defaults: InterviewDefaults) => void;
}) {
  const { showToast } = useToast();
  const [mode, setMode] = useState<InterviewMode>(initialDefaults?.mode ?? 'video');
  // Legacy fallback: before the type-aware fields, phone defaults stored the
  // number in locationText.
  const [phoneNumber, setPhoneNumber] = useState(initialDefaults?.phoneNumber
    ?? (initialDefaults?.mode === 'phone' ? initialDefaults.locationText ?? '' : ''));
  const [direction, setDirection] = useState<PhoneCallDirection>(initialDefaults?.phoneCallDirection ?? 'we_call');
  const [address, setAddress] = useState(initialDefaults?.mode === 'in_person' ? initialDefaults.locationText ?? '' : '');
  const [arrivalInstructions, setArrivalInstructions] = useState(initialDefaults?.arrivalInstructions ?? '');
  const [durationMinutes, setDurationMinutes] = useState(initialDefaults?.durationMinutes ?? 45);
  const [saving, setSaving] = useState(false);

  // Video needs no fields here — the meeting link is entered PER-DATE in the
  // add-times panel, so type + duration alone are saveable.
  const canSave = mode === 'video' ? true
    : mode === 'phone' ? Boolean(phoneNumber.trim()) : Boolean(address.trim());

  async function handleSave(): Promise<void> {
    if (saving || !canSave) return;
    setSaving(true);
    try {
      const defaults: InterviewDefaults = {
        mode,
        // No link field here anymore (it moved to the per-date add-times
        // panel) — carry any previously-saved default through unchanged.
        meetingUrl: mode === 'video' ? initialDefaults?.meetingUrl ?? null : null,
        locationText: mode === 'in_person' ? address.trim() : null,
        phoneNumber: mode === 'phone' ? phoneNumber.trim() : null,
        phoneCallDirection: mode === 'phone' ? direction : null,
        arrivalInstructions: mode === 'in_person' ? arrivalInstructions.trim() || null : null,
        durationMinutes,
        timezoneId: 'Asia/Kolkata',
      };
      await updateInterviewDefaults(postingId, defaults);
      showToast('success', 'Interview details saved');
      onSaved(defaults);
    } catch (caught) {
      showToast('error', caught instanceof EmployerInterviewTimesApiError ? caught.message : 'Could not save. Try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <p style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 500, color: 'var(--ink)' }}>Interview details</p>

      <p style={LABEL_STYLE}>Type</p>
      <div role="group" aria-label="Interview type" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
        {MODE_OPTIONS.map((option) => (
          <PillToggle key={option.value} label={option.label} selected={mode === option.value} onSelect={() => setMode(option.value)} />
        ))}
      </div>

      <p style={LABEL_STYLE}>Duration</p>
      <div role="group" aria-label="Interview duration" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {DURATION_OPTIONS.map((minutes) => (
          <PillToggle key={minutes} label={`${minutes}m`} selected={durationMinutes === minutes} onSelect={() => setDurationMinutes(minutes)} />
        ))}
      </div>

      <div style={DIVIDER} />

      {/* Video: NO link field here — the meeting link is entered per-date in
          the add-times panel, so nothing type-specific to collect. */}
      {mode === 'phone' && (
        <>
          <label style={{ display: 'block', marginBottom: 10 }}>
            <p style={LABEL_STYLE}>Phone number</p>
            <input type="tel" aria-label="Phone number" value={phoneNumber} style={INPUT_STYLE} onChange={(event) => setPhoneNumber(event.target.value)} />
          </label>
          <p style={LABEL_STYLE}>Who calls whom?</p>
          <div role="group" aria-label="Who calls whom" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {DIRECTION_OPTIONS.map((option) => (
              <PillToggle key={option.value} label={option.label} selected={direction === option.value} onSelect={() => setDirection(option.value)} />
            ))}
          </div>
        </>
      )}
      {mode === 'in_person' && (
        <>
          <label style={{ display: 'block', marginBottom: 10 }}>
            <p style={LABEL_STYLE}>Address</p>
            <textarea aria-label="Address" value={address} rows={3} style={INPUT_STYLE} onChange={(event) => setAddress(event.target.value)} />
          </label>
          <label style={{ display: 'block' }}>
            <p style={LABEL_STYLE}>Arrival instructions (optional)</p>
            <textarea
              aria-label="Arrival instructions" value={arrivalInstructions} rows={2} style={INPUT_STYLE}
              placeholder="Floor, building name, ask for whom at reception, parking, etc."
              onChange={(event) => setArrivalInstructions(event.target.value)}
            />
          </label>
        </>
      )}

      <div style={{ marginTop: 12 }}>
        <Button size="sm" fullWidth loading={saving} disabled={!canSave || saving} onClick={() => void handleSave()}>Save details</Button>
      </div>
    </div>
  );
}
