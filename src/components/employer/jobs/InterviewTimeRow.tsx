'use client';
// FILE: src/components/employer/jobs/InterviewTimeRow.tsx
// One time row: aligned clock, 6px status dot + coloured status text, the
// truncated meeting link on every active row (amber when it differs from the
// date's majority link, muted when it matches), trash on available rows only.
// The list endpoint returns no candidate name (only bookedByApplicationId), so
// booked rows read "booked" without a name — no per-row API calls.

import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui';
import type { InterviewTime } from '@/types/employer-interviews';
import { formatInterviewClockTime } from '@/utils/format-interview-time';

const AVAILABLE_GREEN = '#1D9E75';
const DOT_COLOR: Record<string, string> = { available: AVAILABLE_GREEN, booked: 'var(--accent)' };
const STATUS_COLOR: Record<string, string> = { available: 'var(--ink-2)', booked: 'var(--accent)' };

const truncateLink = (url: string) => url.replace(/^https?:\/\//, '');

export default function InterviewTimeRow({
  time, onRemove, withSeparator = false, majorityLink = null, readOnly = false,
}: {
  time: InterviewTime;
  onRemove: (timeId: string) => void;
  /** 0.5px border-b between rows; the last row omits it. */
  withSeparator?: boolean;
  /** The date's most common link — a differing row link renders in warning. */
  majorityLink?: string | null;
  /** Past dates: view only, no trash even on available rows. */
  readOnly?: boolean;
}) {
  const isCancelled = time.status !== 'available' && time.status !== 'booked';
  const linkDiffers = time.meetingUrl !== null && majorityLink !== null && time.meetingUrl !== majorityLink;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, minHeight: 32,
      opacity: isCancelled ? 0.55 : 1,
      borderBottom: withSeparator ? '0.5px solid var(--border)' : 'none',
      paddingBottom: withSeparator ? 4 : 0,
    }}>
      <span style={{ minWidth: 74, fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>
        {formatInterviewClockTime(time.startAtUtc)}
      </span>
      <span aria-hidden style={{
        width: 6, height: 6, borderRadius: 999, flexShrink: 0,
        background: DOT_COLOR[time.status] ?? 'var(--ink-faint)',
        border: isCancelled ? '1px solid var(--ink-faint)' : 'none',
      }} />
      <span style={{ fontSize: 12, color: STATUS_COLOR[time.status] ?? 'var(--ink-faint)' }}>
        {time.status}
      </span>
      {!isCancelled && time.meetingUrl && (
        <span style={{
          fontSize: 11, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis',
          whiteSpace: 'nowrap', color: linkDiffers ? 'var(--warning)' : 'var(--ink-faint)',
        }}>
          {truncateLink(time.meetingUrl)}
        </span>
      )}
      <span style={{ flex: 1 }} />
      {time.status === 'available' && !readOnly && (
        <Button variant="ghost" size="sm" aria-label={`Remove ${formatInterviewClockTime(time.startAtUtc)}`} onClick={() => onRemove(time.id)}>
          <Trash2 size={14} style={{ color: 'var(--ink-2)' }} />
        </Button>
      )}
    </div>
  );
}
