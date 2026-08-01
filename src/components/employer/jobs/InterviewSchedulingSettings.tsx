'use client';
// FILE: src/components/employer/jobs/InterviewSchedulingSettings.tsx
// Interview scheduling Settings tab, calendar edition: 240px details column on
// the left (pill toggles + summary card), mini month calendar + day detail
// panel on the right. Default selected date: today, or the next date with an
// available time. The per-date meeting link is per-session state, prefilled
// from the saved default and preserved across date/month switches.

import { useCallback, useEffect, useRef, useState } from 'react';
import { Card, Stack, useToast } from '@/components/ui';
import { listInterviewTimes } from '@/api/employer-interview-times-api';
import type { Posting } from '@/types/employer-jobs';
import type { InterviewDefaults, InterviewTime } from '@/types/employer-interviews';
import { defaultSelectedDate, todayIstDate } from './interview-calendar-helpers';
import InterviewDetailsForm from './InterviewDetailsForm';
import InterviewPoolSummary from './InterviewPoolSummary';
import InterviewCalendarGrid from './InterviewCalendarGrid';
import InterviewDayDetailPanel from './InterviewDayDetailPanel';

export default function InterviewSchedulingSettings({ posting }: { posting: Posting }) {
  const { showToast } = useToast();
  const [defaults, setDefaults] = useState<InterviewDefaults | null>(posting.interviewDefaults ?? null);
  const [times, setTimes] = useState<InterviewTime[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [viewMonth, setViewMonth] = useState(() => {
    const today = todayIstDate();
    return { year: Number(today.slice(0, 4)), month: Number(today.slice(5, 7)) };
  });
  const [meetingLink, setMeetingLink] = useState(posting.interviewDefaults?.meetingUrl ?? '');

  // Pick the initial date once the FIRST load lands (today, or the next date
  // with an available time); refetches never reset the selection.
  const initializedRef = useRef(false);
  const refetch = useCallback(async () => {
    try {
      const rows = await listInterviewTimes(posting.id, { includePast: true });
      setTimes(rows);
      if (!initializedRef.current) {
        initializedRef.current = true;
        setSelectedDate(defaultSelectedDate(rows));
      }
    } catch {
      showToast('error', 'Could not load interview times.');
    }
  }, [posting.id, showToast]);
  useEffect(() => { void refetch(); }, [refetch]);

  function handleSaved(saved: InterviewDefaults): void {
    setDefaults(saved);
    if (saved.meetingUrl) setMeetingLink(saved.meetingUrl);
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
          {/* Left — details + summary. */}
          <div style={{ flex: '0 1 240px', minWidth: 240, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <InterviewDetailsForm
              postingId={posting.id}
              initialDefaults={defaults}
              onSaved={handleSaved}
            />
            <div style={{ borderTop: '0.5px solid var(--border)', paddingTop: 14 }}>
              <InterviewPoolSummary times={times} />
            </div>
          </div>
          {/* Right — calendar + day detail. */}
          {/* Internal scroll so the day detail panel never forces page scroll. */}
          <div style={{ flex: '1 1 420px', minWidth: 340, maxHeight: 'calc(100vh - 160px)', overflowY: 'auto' }}>
            <InterviewCalendarGrid
              year={viewMonth.year}
              month={viewMonth.month}
              times={times}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              onMonthChange={setViewMonth}
            />
            {selectedDate && (
              <InterviewDayDetailPanel
                postingId={posting.id}
                dateIso={selectedDate}
                times={times}
                durationMinutes={defaults?.durationMinutes ?? 45}
                mode={defaults?.mode ?? 'video'}
                defaultsSaved={defaults !== null}
                meetingLink={meetingLink}
                onMeetingLinkChange={setMeetingLink}
                refetch={refetch}
              />
            )}
          </div>
        </div>
      </Stack>
    </Card>
  );
}
