'use client';
// FILE: src/components/employer/jobs/InterviewAvailabilitySection.tsx
// "Interview availability" section on the posting Settings tab: interview
// defaults + the pool of bookable times. The times manager unlocks only once
// defaults exist. Local defaults state bridges the gap until the posting
// payload carries interviewDefaults on reload.

import { useState } from 'react';
import { Card, Stack } from '@/components/ui';
import type { Posting } from '@/types/employer-jobs';
import type { InterviewDefaults } from '@/types/employer-interviews';
import InterviewDefaultsForm from './InterviewDefaultsForm';
import InterviewTimesManager from './InterviewTimesManager';

export default function InterviewAvailabilitySection({ posting }: { posting: Posting }) {
  const [defaults, setDefaults] = useState<InterviewDefaults | null>(posting.interviewDefaults ?? null);

  return (
    <Card>
      <Stack gap={16}>
        <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--ink)' }}>Interview availability</h3>
        <InterviewDefaultsForm
          postingId={posting.id}
          initialDefaults={defaults}
          onSaved={setDefaults}
        />
        {defaults && (
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
            <p style={{ margin: '0 0 10px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--ink)' }}>Available times</p>
            <InterviewTimesManager postingId={posting.id} />
          </div>
        )}
      </Stack>
    </Card>
  );
}
