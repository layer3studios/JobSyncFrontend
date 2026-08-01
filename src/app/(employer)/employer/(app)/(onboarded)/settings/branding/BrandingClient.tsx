'use client';
// FILE: settings/branding/BrandingClient.tsx
// Branding: a live preview of how the company reads on the public careers and
// apply pages (initials mark + name), plus the careers link. Nothing here is
// configurable yet — the preview is the honest current state, not a mockup.

import { useEmployer } from '@/context/employer/EmployerContext';
import { useToast } from '@/components/ui';
import { getInitials } from '@/components/employer/jobs/score-badge-helpers';
import Breadcrumbs from '@/components/employer/Breadcrumbs';
import SettingsPageHeader from '../parts/SettingsPageHeader';
import CareersPageLink from '../parts/CareersPageLink';

export default function BrandingClient() {
  const { company } = useEmployer();
  const { showToast } = useToast();

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Settings' }, { label: 'Branding' }]} />
      <SettingsPageHeader
        title="Branding"
        subtitle="How your company appears to candidates."
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 640 }}>
        <div>
          <p style={{ margin: '0 0 6px', fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>
            Careers page preview
          </p>
          <div style={{
            background: 'var(--surface-raised)', border: '0.5px solid var(--border)',
            borderRadius: 12, padding: 20, display: 'flex', alignItems: 'center', gap: 14,
          }}>
            <span aria-hidden data-testid="branding-initials" style={{
              width: 48, height: 48, borderRadius: '50%', flexShrink: 0,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 17, fontWeight: 600,
              background: 'var(--accent-soft)', color: 'var(--accent)',
            }}>
              {getInitials(company?.name)}
            </span>
            <div style={{ minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 20, fontWeight: 600, color: 'var(--ink)' }}>
                {company?.name ?? 'Your company'}
              </p>
              <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--ink-2)' }}>
                Open roles
              </p>
            </div>
          </div>
          <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--ink-faint)' }}>
            Customize your logo, colors, and apply page theme — coming soon.
          </p>
        </div>

        {company && (
          <CareersPageLink slug={company.slug} onCopied={() => showToast('success', 'Careers link copied.')} />
        )}
      </div>
    </div>
  );
}
