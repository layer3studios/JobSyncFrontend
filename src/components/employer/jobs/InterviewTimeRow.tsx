'use client';
// FILE: src/components/employer/jobs/InterviewTimeRow.tsx
// One time row inside a day group: clock time, status dot (colour + text —
// never colour alone), booked label or a trash remove for available times.
// The list endpoint carries only bookedByApplicationId, so booked rows read
// "Booked" (no candidate name in v1).

import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui';
import type { InterviewTime } from '@/types/employer-interviews';
import { formatInterviewClockTime } from '@/utils/format-interview-time';

const DOT_COLOR: Record<string, string> = {
  available: 'var(--success)', booked: 'var(--info)',
};

export default function InterviewTimeRow({
  time, onRemove,
}: {
  time: InterviewTime;
  onRemove: (timeId: string) => void;
}) {
  const isCancelled = time.status !== 'available' && time.status !== 'booked';
  const clock = formatInterviewClockTime(time.startAtUtc);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, opacity: isCancelled ? 0.55 : 1, minHeight: 32 }}>
      <span style={{ width: 74, fontSize: '0.85rem', fontWeight: 600, color: 'var(--ink)' }}>{clock}</span>
      <span aria-hidden style={{ width: 8, height: 8, borderRadius: 999, background: DOT_COLOR[time.status] ?? 'var(--ink-faint)' }} />
      <span style={{ flex: 1, fontSize: '0.8rem', color: 'var(--ink-muted)' }}>
        {time.status === 'booked' ? 'Booked' : time.status}
      </span>
      {time.status === 'available' && (
        <Button variant="ghost" size="sm" aria-label={`Remove ${clock}`} onClick={() => onRemove(time.id)}>
          <Trash2 size={14} />
        </Button>
      )}
    </div>
  );
}
