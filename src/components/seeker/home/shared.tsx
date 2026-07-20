// FILE: src/components/seeker/home/shared.tsx
import type { CSSProperties } from 'react';

export function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="font-display" style={{
        fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 600,
        color: 'var(--ink)', letterSpacing: '-0.025em', lineHeight: 1,
      }}>{value}</div>
      <div style={{ fontSize: '0.8rem', color: 'var(--ink-muted)', marginTop: 4 }}>{label}</div>
    </div>
  );
}

export const sectionLabel: CSSProperties = {
  fontSize: '0.75rem', color: 'var(--ink-muted)',
  letterSpacing: '0.05em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 6,
};

export const sectionTitle: CSSProperties = {
  fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 600,
  color: 'var(--ink)', letterSpacing: '-0.025em', lineHeight: 1.15,
};

export const linkStyle: CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 4,
  fontSize: '0.85rem', color: 'var(--ink-muted)',
  textDecoration: 'none', fontWeight: 500,
};

export const scrollBtn: CSSProperties = {
  width: 30, height: 30, borderRadius: 8,
  background: 'var(--surface)', border: '1px solid var(--border)',
  color: 'var(--ink-muted)', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};
