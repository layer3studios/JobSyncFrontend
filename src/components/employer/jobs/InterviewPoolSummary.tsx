'use client';
// FILE: src/components/employer/jobs/InterviewPoolSummary.tsx
// Quick-stats card at the top of the left panel — availability at a glance
// plus the next open time. (No copy-link button: pool links are per-candidate,
// generated on send.)

import type { InterviewTime } from '@/types/employer-interviews';
import { summarizeTimes } from './interview-time-grouping-helpers';
import { formatInterviewTimeShort } from '@/utils/format-interview-time';
import { utcIsoToIstLocal } from '@/utils/ist-datetime';

export default function InterviewPoolSummary({ times }: { times: InterviewTime[] }) {
  const summary = summarizeTimes(times);
  const availableDayCount = new Set(
    times.filter((time) => time.status === 'available').map((time) => utcIsoToIstLocal(time.startAtUtc).slice(0, 10)),
  ).size;
  const nextAvailable = times
    .filter((time) => time.status === 'available' && new Date(time.startAtUtc) > new Date())
    .sort((a, b) => a.startAtUtc.localeCompare(b.startAtUtc))[0] ?? null;

  if (summary.total === 0) return null;
  return (
    <div style={{
      background: 'var(--surface-sunken)', border: '0.5px solid var(--border)',
      borderRadius: 12, padding: '12px 16px', marginBottom: 14,
    }}>
      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>
        {summary.available} time{summary.available === 1 ? '' : 's'} available across {availableDayCount} day{availableDayCount === 1 ? '' : 's'}
      </p>
      <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--ink-2)' }}>
        {summary.booked} interview{summary.booked === 1 ? '' : 's'} booked
      </p>
      {nextAvailable && (
        <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--ink-muted)' }}>
          Next available: {formatInterviewTimeShort(nextAvailable.startAtUtc)}
        </p>
      )}
    </div>
  );
}
