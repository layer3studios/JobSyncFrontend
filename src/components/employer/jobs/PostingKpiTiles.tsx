'use client';
// FILE: src/components/employer/jobs/PostingKpiTiles.tsx
// The four Overview KPI tiles. Unknowable numbers render "—".

const TILE = {
  background: 'var(--surface-raised)', border: '0.5px solid var(--border)',
  borderRadius: 12, padding: '14px 16px',
} as const;

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div style={TILE}>
      <p style={{ margin: 0, fontSize: 12, color: 'var(--ink-2)' }}>{label}</p>
      <p style={{ margin: '4px 0 0', fontSize: 28, fontWeight: 500, color: 'var(--ink)' }}>{value}</p>
    </div>
  );
}

export default function PostingKpiTiles({
  totalApplicants, averageScore, interviewsScheduled, daysOpen,
}: {
  totalApplicants: number | null;
  averageScore: number | null;
  interviewsScheduled: number | null;
  daysOpen: number;
}) {
  const show = (value: number | null): string => (value == null ? '—' : String(value));
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
      <Tile label="Total applicants" value={show(totalApplicants)} />
      <Tile label="Avg. AI score" value={show(averageScore)} />
      <Tile label="Interviews scheduled" value={show(interviewsScheduled)} />
      <Tile label="Days open" value={String(daysOpen)} />
    </div>
  );
}
