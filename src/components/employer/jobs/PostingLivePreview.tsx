'use client';
// FILE: src/components/employer/jobs/PostingLivePreview.tsx
// Sticky live preview beside the New Posting form — a miniature apply page
// rendered purely client-side from the in-progress form values. Pills appear
// only for filled fields; the Apply button is decorative.

import { useEmployer } from '@/context/employer/EmployerContext';
import { getInitials } from './score-badge-helpers';
import type { PostingFormValues } from './posting-form-helpers';

const PREVIEW_DESCRIPTION_LIMIT = 300;
const PILL = {
  fontSize: 11, padding: '2px 8px', borderRadius: 999,
  background: 'var(--surface-sunken)', color: 'var(--ink-2)', border: '0.5px solid var(--border)',
} as const;

const WORKPLACE_LABEL: Record<string, string> = { remote: 'Remote', hybrid: 'Hybrid', onsite: 'On-site' };

export default function PostingLivePreview({ values }: { values: PostingFormValues }) {
  const { company } = useEmployer();
  const description = values.description.trim();
  const salaryText = values.salaryMinStr || values.salaryMaxStr
    ? `₹ ${values.salaryMinStr || '—'} – ${values.salaryMaxStr || '—'} LPA` : '';
  const pills = [
    values.location.trim(),
    WORKPLACE_LABEL[values.workplaceType] ?? '',
    values.employmentType,
    salaryText,
  ].filter(Boolean);

  return (
    <div style={{ position: 'sticky', top: 16, alignSelf: 'start' }}>
      <p style={{ margin: '0 0 2px', fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>Live preview</p>
      <p style={{ margin: '0 0 10px', fontSize: 11, color: 'var(--ink-faint)' }}>How candidates see it</p>
      <div style={{ background: 'var(--surface-raised)', border: '0.5px solid var(--border)', borderRadius: 12, padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <span aria-hidden style={{
            width: 28, height: 28, borderRadius: '50%', display: 'inline-flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 11, fontWeight: 600,
            background: 'var(--accent-soft)', color: 'var(--accent)',
          }}>
            {getInitials(company?.name)}
          </span>
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>{company?.name ?? 'Your company'}</span>
        </div>
        <p style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>
          {values.title.trim() || 'Untitled'}
        </p>
        {pills.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
            {pills.map((pill) => <span key={pill} style={PILL}>{pill}</span>)}
          </div>
        )}
        {description && (
          <p style={{ margin: '0 0 12px', fontSize: 12, lineHeight: 1.6, color: 'var(--ink-2)', whiteSpace: 'pre-wrap' }}>
            {description.length > PREVIEW_DESCRIPTION_LIMIT ? `${description.slice(0, PREVIEW_DESCRIPTION_LIMIT)}...` : description}
          </p>
        )}
        <span aria-hidden style={{
          display: 'inline-block', padding: '6px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600,
          background: 'var(--accent)', color: 'var(--text-on-accent)', cursor: 'default',
        }}>
          Apply now
        </span>
      </div>
      <p style={{ margin: '8px 0 0', fontSize: 11, color: 'var(--ink-faint)' }}>
        This is how your posting appears on JobMesh
      </p>
    </div>
  );
}
