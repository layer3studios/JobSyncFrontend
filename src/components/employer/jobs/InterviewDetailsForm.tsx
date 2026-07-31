'use client';
// FILE: src/components/employer/jobs/InterviewDetailsForm.tsx
// Left-side interview details form (pool scheduling defaults): type, link/
// phone/address, duration, its own Save. `meetingLinkInputId` lets the times
// panel's "Change in details" jump straight to the link input.

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
  postingId, initialDefaults, onSaved, meetingLinkInputId,
}: {
  postingId: string;
  initialDefaults: InterviewDefaults | null;
  onSaved: (defaults: InterviewDefaults) => void;
  meetingLinkInputId?: string;
}) {
  const { showToast } = useToast();
  const [mode, setMode] = useState<InterviewMode>(initialDefaults?.mode ?? 'video');
  const [meetingUrl, setMeetingUrl] = useState(initialDefaults?.meetingUrl ?? '');
  const [phoneNumber, setPhoneNumber] = useState(initialDefaults?.mode === 'phone' ? initialDefaults.locationText ?? '' : '');
  const [address, setAddress] = useState(initialDefaults?.mode === 'in_person' ? initialDefaults.locationText ?? '' : '');
  const [durationMinutes, setDurationMinutes] = useState(initialDefaults?.durationMinutes ?? 45);
  const [saving, setSaving] = useState(false);

  const locationText = mode === 'phone' ? phoneNumber.trim() : mode === 'in_person' ? address.trim() : null;
  const canSave = mode === 'video' ? /^https?:\/\/\S+$/i.test(meetingUrl.trim()) : Boolean(locationText);

  async function handleSave(): Promise<void> {
    if (saving || !canSave) return;
    setSaving(true);
    try {
      const defaults: InterviewDefaults = {
        mode,
        meetingUrl: mode === 'video' ? meetingUrl.trim() : null,
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
      {mode === 'video' && (
        <Input
          id={meetingLinkInputId}
          label="Meeting link"
          placeholder="https://meet.google.com/..."
          hint="This link is shared with candidates after they confirm a time."
          value={meetingUrl}
          onChange={(event) => setMeetingUrl(event.target.value)}
        />
      )}
      {mode === 'phone' && (
        <Input label="Phone number" value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} />
      )}
      {mode === 'in_person' && (
        <Textarea label="Address" value={address} onChange={(event) => setAddress(event.target.value)} />
      )}
      <Select
        label="Duration"
        value={String(durationMinutes)}
        options={DURATION_OPTIONS}
        onChange={(event) => setDurationMinutes(Number(event.target.value))}
      />
      <div><Button size="sm" loading={saving} disabled={!canSave || saving} onClick={() => void handleSave()}>Save interview details</Button></div>
    </Stack>
  );
}
