'use client';
// FILE: src/components/employer/jobs/InterviewDayDetailPanel.tsx
// The card below the calendar for the selected date: heading + counts, the
// per-date meeting-link input (video), that date's existing time rows
// (cancelled behind a toggle), and the chip-grid add flow. Past dates render
// read-only with no add controls.

import { useState } from 'react';
import { CalendarDays } from 'lucide-react';
import { Button, Stack, useToast } from '@/components/ui';
import { removeInterviewTime, EmployerInterviewTimesApiError } from '@/api/employer-interview-times-api';
import type { InterviewMode, InterviewTime } from '@/types/employer-interviews';
import { istLocalToUtcIso, utcIsoToIstLocal } from '@/utils/ist-datetime';
import { formatInterviewDayHeading } from '@/utils/format-interview-time';
import { todayIstDate } from './interview-calendar-helpers';
import InterviewTimeRow from './InterviewTimeRow';
import InterviewDayAddTimes from './InterviewDayAddTimes';

const dayHeading = (dateIso: string): string => {
  const utcIso = istLocalToUtcIso(`${dateIso}T12:00`);
  return utcIso ? formatInterviewDayHeading(utcIso) : dateIso;
};

export default function InterviewDayDetailPanel({
  postingId, dateIso, times, durationMinutes, mode, defaultsSaved, meetingLink, onMeetingLinkChange, refetch,
}: {
  postingId: string;
  dateIso: string;
  times: InterviewTime[];
  durationMinutes: number;
  mode: InterviewMode;
  defaultsSaved: boolean;
  meetingLink: string;
  onMeetingLinkChange: (value: string) => void;
  refetch: () => Promise<void>;
}) {
  const { showToast } = useToast();
  const [showCancelled, setShowCancelled] = useState(false);
  const isPast = dateIso < todayIstDate();

  const dayTimes = times
    .filter((time) => utcIsoToIstLocal(time.startAtUtc).slice(0, 10) === dateIso)
    .sort((a, b) => a.startAtUtc.localeCompare(b.startAtUtc));
  const activeTimes = dayTimes.filter((time) => time.status === 'available' || time.status === 'booked');
  const cancelledTimes = dayTimes.filter((time) => time.status !== 'available' && time.status !== 'booked');
  const availableCount = activeTimes.filter((time) => time.status === 'available').length;
  const bookedCount = activeTimes.length - availableCount;

  async function handleRemove(timeId: string): Promise<void> {
    try {
      await removeInterviewTime(postingId, timeId);
      await refetch();
    } catch (caught) {
      showToast('error', caught instanceof EmployerInterviewTimesApiError ? caught.message : 'Could not remove that time.');
    }
  }

  return (
    <div data-testid="day-detail-panel" style={{ background: 'var(--surface-sunken)', border: '0.5px solid var(--border)', borderRadius: 12, padding: 16, marginTop: 14 }}>
      <Stack gap={10}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <CalendarDays size={15} style={{ color: 'var(--ink-2)' }} />
          <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)' }}>{dayHeading(dateIso)}</span>
          <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--ink-2)' }}>
            {availableCount} available · {bookedCount} booked
          </span>
        </div>

        {!isPast && mode === 'video' && (
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: 'var(--ink-2)', maxWidth: 360 }}>
            Meeting link for this date
            <input
              type="url"
              value={meetingLink}
              onChange={(event) => onMeetingLinkChange(event.target.value)}
              style={{ padding: '6px 9px', border: '0.5px solid var(--border)', borderRadius: 8, fontSize: 12, background: 'var(--surface-raised)', color: 'var(--ink)' }}
            />
          </label>
        )}

        {activeTimes.length > 0 && (
          <div>
            {activeTimes.map((time, index) => (
              <InterviewTimeRow
                key={time.id} time={time} onRemove={(id) => void handleRemove(id)}
                withSeparator={index < activeTimes.length - 1} readOnly={isPast}
              />
            ))}
          </div>
        )}
        {showCancelled && cancelledTimes.map((time) => (
          <InterviewTimeRow key={time.id} time={time} onRemove={() => {}} readOnly />
        ))}
        {cancelledTimes.length > 0 && (
          <div>
            <Button variant="link" size="sm" onClick={() => setShowCancelled((current) => !current)}>
              {showCancelled ? 'Hide cancelled' : `Show ${cancelledTimes.length} cancelled`}
            </Button>
          </div>
        )}

        {isPast ? (
          <p style={{ margin: 0, fontSize: 12, color: 'var(--ink-muted)' }}>This date is in the past.</p>
        ) : (
          <>
            {activeTimes.length === 0 && (
              <p style={{ margin: 0, fontSize: 12, color: 'var(--ink-muted)' }}>
                No times on this date. Tap times below to add availability. ↓
              </p>
            )}
            <InterviewDayAddTimes
              postingId={postingId}
              dateIso={dateIso}
              durationMinutes={durationMinutes}
              mode={mode}
              defaultsSaved={defaultsSaved}
              meetingLink={meetingLink}
              existingTimes={times}
              onAdded={refetch}
            />
          </>
        )}
      </Stack>
    </div>
  );
}
