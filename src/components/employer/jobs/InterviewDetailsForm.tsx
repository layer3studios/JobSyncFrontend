'use client';
// FILE: src/components/employer/jobs/InterviewDetailsForm.tsx
// Left-side interview details form: type, duration, and phone/address for the
// non-video modes. The MEETING LINK is not configured here any more — it lives
// in the Add-times panel (link at scheduling time, Greenhouse style). The
// backend's defaults endpoint still requires a video meetingUrl, so a video
// save sends the panel's current link (`currentMeetingLink`) as the default.

import { useState } from 'react';
import { Button, Input, Textarea, Select, Radio, Stack, useToast } from '@/components/ui';
import { updateInterviewDefaults, EmployerInterviewTimesApiError } from '@/api/employer-interview-times-api';
import type { InterviewDefaults, InterviewMode } from '@/types/employer-interviews';

const MODE_OPTIONS = [
  { value: 'video', label: 'Video call' },
  { value: 'phone', label: 'Phone call' },
  { value: 'in_person', label: 'In person' },
];
const DURATION_OPTIONS = [15, 30, 45, 60, 90].map((minutes) => ({ value: String(minutes), label: `${minutes} minutes` }));

export default function InterviewDetailsForm({
  postingId, initialDefaults, currentMeetingLink, onSaved,
}: {
  postingId: string;
  initialDefaults: InterviewDefaults | null;
  /** The Add-times panel's link — used as the saved default for video mode. */
  currentMeetingLink: string;
  onSaved: (defaults: InterviewDefaults) => void;
}) {
  const { showToast } = useToast();
  const [mode, setMode] = useState<InterviewMode>(initialDefaults?.mode ?? 'video');
  const [phoneNumber, setPhoneNumber] = useState(initialDefaults?.mode === 'phone' ? initialDefaults.locationText ?? '' : '');
  const [address, setAddress] = useState(initialDefaults?.mode === 'in_person' ? initialDefaults.locationText ?? '' : '');
  const [durationMinutes, setDurationMinutes] = useState(initialDefaults?.durationMinutes ?? 45);
  const [saving, setSaving] = useState(false);

  const locationText = mode === 'phone' ? phoneNumber.trim() : mode === 'in_person' ? address.trim() : null;
  const linkValid = /^https?:\/\/\S+$/i.test(currentMeetingLink.trim());
  const canSave = mode === 'video' ? linkValid : Boolean(locationText);

  async function handleSave(): Promise<void> {
    if (saving || !canSave) return;
    setSaving(true);
    try {
      const defaults: InterviewDefaults = {
        mode,
        meetingUrl: mode === 'video' ? currentMeetingLink.trim() : null,
        locationText,
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
    <Stack gap={14}>
      <fieldset style={{ border: 0, margin: 0, padding: 0 }}>
        <legend style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 8 }}>Interview type</legend>
        <Radio direction="horizontal" options={MODE_OPTIONS} value={mode} onChange={(value) => setMode(value as InterviewMode)} />
      </fieldset>
      {mode === 'phone' && (
        <Input label="Phone number" hint="Applies to all interview times." value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} />
      )}
      {mode === 'in_person' && (
        <Textarea label="Address" hint="Applies to all interview times." value={address} onChange={(event) => setAddress(event.target.value)} />
      )}
      <Select
        label="Duration"
        value={String(durationMinutes)}
        options={DURATION_OPTIONS}
        onChange={(event) => setDurationMinutes(Number(event.target.value))}
      />
      {mode === 'video' && !linkValid && (
        <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--ink-muted)' }}>
          Enter a meeting link in the Add times panel to save video details.
        </p>
      )}
      <div><Button size="sm" loading={saving} disabled={!canSave || saving} onClick={() => void handleSave()}>Save interview details</Button></div>
    </Stack>
  );
}
