'use client';
// FILE: src/components/employer/jobs/InterviewSchedulingSettings.tsx
// Interview scheduling Settings tab: full-width two-column layout — details
// form (40%) on the left, the day-grouped times workspace (60%) on the right;
// columns stack on narrow screens via flex-wrap + min-widths. Owns the shared
// state: saved defaults, the times list, and the add panel's selected date
// (so "+ Add more times to this date" is one click).

import { useCallback, useEffect, useState } from 'react';
import { Card, Stack, useToast } from '@/components/ui';
import { listInterviewTimes } from '@/api/employer-interview-times-api';
import type { Posting } from '@/types/employer-jobs';
import type { InterviewDefaults, InterviewTime } from '@/types/employer-interviews';
import { utcIsoToIstLocal } from '@/utils/ist-datetime';
import InterviewDetailsForm from './InterviewDetailsForm';
import InterviewTimesPanel from './InterviewTimesPanel';

const MEETING_LINK_INPUT_ID = 'interview-defaults-meeting-link';

/** Tomorrow as an IST calendar day ('YYYY-MM-DD') — the most useful default. */
const tomorrowIstDate = () => utcIsoToIstLocal(new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()).slice(0, 10);

export default function InterviewSchedulingSettings({ posting }: { posting: Posting }) {
  const { showToast } = useToast();
  const [defaults, setDefaults] = useState<InterviewDefaults | null>(posting.interviewDefaults ?? null);
  const [times, setTimes] = useState<InterviewTime[]>([]);
  const [selectedDate, setSelectedDate] = useState(tomorrowIstDate);

  const refetch = useCallback(async () => {
    try {
      setTimes(await listInterviewTimes(posting.id, { includePast: false }));
    } catch {
      showToast('error', 'Could not load interview times.');
    }
  }, [posting.id, showToast]);
  useEffect(() => { void refetch(); }, [refetch]);

  function focusMeetingLink(): void {
    const input = document.getElementById(MEETING_LINK_INPUT_ID);
    input?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    (input as HTMLInputElement | null)?.focus();
  }

  return (
    <Card style={{ width: '100%' }}>
      <Stack gap={16}>
        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--ink)' }}>Interview scheduling</h3>
        {!defaults && (
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--ink-muted)' }}>
            Configure your interview details and add available times to enable one-click scheduling.
          </p>
        )}
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start', width: '100%' }}>
          {/* Left — configuration: set once, change rarely. */}
          <div style={{ flex: '2 1 280px', minWidth: 280 }}>
            <InterviewDetailsForm
              postingId={posting.id}
              initialDefaults={defaults}
              onSaved={setDefaults}
              meetingLinkInputId={MEETING_LINK_INPUT_ID}
            />
          </div>
          {/* Right — the active scheduling workspace. */}
          <div style={{ flex: '3 1 340px', minWidth: 320 }}>
            <InterviewTimesPanel
              postingId={posting.id}
              times={times}
              refetch={refetch}
              defaultsSaved={defaults !== null}
              durationMinutes={defaults?.durationMinutes ?? 45}
              meetingUrl={defaults?.meetingUrl ?? null}
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
              onFocusMeetingLink={focusMeetingLink}
            />
          </div>
        </div>
      </Stack>
    </Card>
  );
}
