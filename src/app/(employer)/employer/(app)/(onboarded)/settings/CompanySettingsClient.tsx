'use client';
// FILE: settings/CompanySettingsClient.tsx
// Company settings: editable name (PATCH /api/employer/company, Owner+ only —
// the backend gates it too), read-only slug, the public careers link, and the
// DPDP retention note. Saving re-syncs the session so the nav/company name
// update everywhere at once.

import { useState } from 'react';
import { Input, Button, useToast } from '@/components/ui';
import { useEmployer } from '@/context/employer/EmployerContext';
import { updateEmployerCompany, EmployerApiError } from '@/api/employer-api';
import { canEditCompanySettings } from '@/lib/team-permissions';
import Breadcrumbs from '@/components/employer/Breadcrumbs';
import SettingsPageHeader from './parts/SettingsPageHeader';
import CareersPageLink from './parts/CareersPageLink';

const FIELD_LABEL = { margin: '0 0 6px', fontSize: 13, fontWeight: 500, color: 'var(--ink)' } as const;
const READ_ONLY_VALUE = {
  padding: '9px 12px', fontSize: 13, border: '1px solid var(--border)', borderRadius: 8,
  background: 'var(--paper-2)', color: 'var(--ink-2)',
} as const;

export default function CompanySettingsClient() {
  const { company, viewerRole, refreshEmployerSession } = useEmployer();
  const { showToast } = useToast();
  const canEdit = viewerRole ? canEditCompanySettings(viewerRole) : false;
  const [name, setName] = useState(company?.name ?? '');
  const [tagline, setTagline] = useState(company?.tagline ?? '');
  const [isSaving, setIsSaving] = useState(false);

  if (!company) {
    return (
      <div>
        <SettingsPageHeader title="Company" />
        <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-2)' }}>Loading company…</p>
      </div>
    );
  }

  const trimmedName = name.trim();
  const trimmedTagline = tagline.trim();
  // An empty tagline is null on the server, so '' and null are the same state here —
  // comparing the trimmed value against (tagline ?? '') keeps clearing it dirty.
  const isNameDirty = trimmedName !== company.name && trimmedName.length > 0;
  const isTaglineDirty = trimmedTagline !== (company.tagline ?? '');
  const isDirty = isNameDirty || isTaglineDirty;

  async function handleSave() {
    setIsSaving(true);
    try {
      // One PATCH for both fields. Empty tagline goes as null so the careers page
      // has a single falsy case and never renders an empty line.
      await updateEmployerCompany({
        name: trimmedName,
        tagline: trimmedTagline === '' ? null : trimmedTagline,
      });
      await refreshEmployerSession();
      showToast('success', 'Company details updated.');
    } catch (error) {
      showToast('error', error instanceof EmployerApiError ? error.message : 'Could not save. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Settings' }, { label: 'Company' }]} />
      <SettingsPageHeader title="Company" subtitle="Your company profile and public careers page." />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 640 }}>
        <div>
          {canEdit ? (
            <>
              <Input
                label="Company name"
                value={name}
                maxLength={120}
                onChange={(event) => setName(event.target.value)}
              />
              <div style={{ marginTop: 12 }}>
                <Input
                  label="Tagline"
                  placeholder="One line about your company"
                  value={tagline}
                  maxLength={120}
                  onChange={(event) => setTagline(event.target.value)}
                />
                <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--ink-faint)', textAlign: 'right' }}>
                  {tagline.length}/120
                </p>
              </div>
              <div style={{ marginTop: 8 }}>
                <Button size="sm" disabled={!isDirty} loading={isSaving} onClick={handleSave}>
                  Save changes
                </Button>
              </div>
            </>
          ) : (
            <>
              <p style={FIELD_LABEL}>Company name</p>
              <div style={READ_ONLY_VALUE}>{company.name}</div>
              <div style={{ marginTop: 12 }}>
                <p style={FIELD_LABEL}>Tagline</p>
                <div style={READ_ONLY_VALUE}>{company.tagline ?? 'Not set'}</div>
              </div>
              <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--ink-faint)' }}>
                Only a Founder or Owner can change these.
              </p>
            </>
          )}
        </div>

        <div>
          <p style={FIELD_LABEL}>Company slug</p>
          <div style={READ_ONLY_VALUE}>{company.slug}</div>
          <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--ink-faint)' }}>
            Used in your careers and apply URLs. Contact support to change it.
          </p>
        </div>

        <CareersPageLink slug={company.slug} onCopied={() => showToast('success', 'Careers link copied.')} />

        <div style={{ borderTop: '0.5px solid var(--border)', paddingTop: 16 }}>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-2)' }}>
            Applicant data retained for {company.retentionDays} days per DPDP compliance.
          </p>
        </div>
      </div>
    </div>
  );
}
