'use client';
// FILE: src/components/employer/jobs/InterviewTimesManager.tsx
// The availability pool list + inline add panel (posting Settings tab). All
// entered times are IST wall-clock (native datetime-local) converted to UTC via
// the chunk-5 utility before sending. Duplicates are skipped server-side.

import { useCallback, useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Button, Badge, Stack, Alert, useToast } from '@/components/ui';
import {
  listInterviewTimes, addInterviewTimes, removeInterviewTime, EmployerInterviewTimesApiError,
} from '@/api/employer-interview-times-api';
import type { InterviewTime } from '@/types/employer-interviews';
import { istLocalToUtcIso } from '@/utils/ist-datetime';
import { formatInterviewTimeShort } from '@/utils/format-interview-time';

const DATETIME_INPUT_STYLE = {
  padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 8,
  fontSize: '0.9rem', background: 'var(--surface-raised)', color: 'var(--ink)',
} as const;

let addRowIdCounter = 0;
const newRow = () => ({ rowId: `add-time-${addRowIdCounter++}`, value: '' });

export default function InterviewTimesManager({ postingId }: { postingId: string }) {
  const { showToast } = useToast();
  const [times, setTimes] = useState<InterviewTime[]>([]);
  const [panelOpen, setPanelOpen] = useState(false);
  const [rows, setRows] = useState([newRow()]);
  const [busy, setBusy] = useState(false);

  const refetch = useCallback(async () => {
    try {
      setTimes(await listInterviewTimes(postingId));
    } catch {
      showToast('error', 'Could not load interview times.');
    }
  }, [postingId, showToast]);
  useEffect(() => { void refetch(); }, [refetch]);

  const availableCount = times.filter((time) => time.status === 'available').length;
  const enteredValues = rows.map((row) => row.value).filter(Boolean);
  const hasPastEntry = enteredValues.some((value) => {
    const utcIso = istLocalToUtcIso(value);
    return !utcIso || new Date(utcIso) <= new Date();
  });

  async function handleAdd(): Promise<void> {
    if (busy || enteredValues.length === 0 || hasPastEntry) return;
    setBusy(true);
    try {
      const { insertedCount } = await addInterviewTimes(postingId, enteredValues.map((value) => ({
        startAtUtc: istLocalToUtcIso(value) as string,
      })));
      showToast('success', `${insertedCount} time${insertedCount === 1 ? '' : 's'} added`);
      setPanelOpen(false);
      setRows([newRow()]);
      await refetch();
    } catch (caught) {
      showToast('error', caught instanceof EmployerInterviewTimesApiError ? caught.message : 'Could not add times. Try again.');
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove(timeId: string): Promise<void> {
    try {
      await removeInterviewTime(postingId, timeId);
      await refetch();
    } catch (caught) {
      showToast('error', caught instanceof EmployerInterviewTimesApiError ? caught.message : 'Could not remove that time.');
    }
  }

  return (
    <Stack gap={12}>
      {availableCount <= 1 && (
        <Alert type="warning">
          You have {availableCount} interview time{availableCount === 1 ? '' : 's'} remaining. Add more to keep scheduling.
        </Alert>
      )}
      {times.length === 0 && (
        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--ink-muted)' }}>No upcoming times yet.</p>
      )}
      {times.map((time) => (
        <div key={time.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ flex: 1, fontSize: '0.88rem', color: 'var(--ink)' }}>{formatInterviewTimeShort(time.startAtUtc)}</span>
          {time.status === 'booked' ? (
            <Badge variant="neutral">Booked</Badge>
          ) : time.status === 'available' ? (
            <Button variant="ghost" size="sm" aria-label={`Remove ${formatInterviewTimeShort(time.startAtUtc)}`} onClick={() => void handleRemove(time.id)}>
              <Trash2 size={14} />
            </Button>
          ) : (
            <Badge variant="neutral">{time.status}</Badge>
          )}
        </div>
      ))}

      {!panelOpen && (
        <div><Button variant="secondary" size="sm" onClick={() => setPanelOpen(true)}>Add times</Button></div>
      )}
      {panelOpen && (
        <Stack gap={8}>
          {rows.map((row, index) => (
            <label key={row.rowId} style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.8rem', color: 'var(--ink-muted)' }}>
              {`New time ${index + 1}`}
              <input
                type="datetime-local"
                value={row.value}
                style={DATETIME_INPUT_STYLE}
                onChange={(event) => setRows((current) => current.map((r) => (r.rowId === row.rowId ? { ...r, value: event.target.value } : r)))}
              />
            </label>
          ))}
          {hasPastEntry && <p role="alert" style={{ margin: 0, fontSize: '0.78rem', color: 'var(--danger)' }}>Every time must be in the future.</p>}
          <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--ink-muted)' }}>Times are in India Standard Time (IST).</p>
          <Stack dir="row" gap={8}>
            <Button variant="ghost" size="sm" onClick={() => setRows((current) => [...current, newRow()])}>Add another</Button>
            <Button size="sm" loading={busy} disabled={busy || enteredValues.length === 0 || hasPastEntry} onClick={() => void handleAdd()}>Add</Button>
            <Button variant="ghost" size="sm" disabled={busy} onClick={() => { setPanelOpen(false); setRows([newRow()]); }}>Cancel</Button>
          </Stack>
        </Stack>
      )}
    </Stack>
  );
}
