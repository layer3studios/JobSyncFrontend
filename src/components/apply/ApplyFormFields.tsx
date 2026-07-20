'use client';
// FILE: src/components/apply/ApplyFormFields.tsx
// The input block for the apply form. Single-column, mobile-first (C10). Owns no
// submit logic — the parent (ApplyFormClient) holds state and passes handlers.
// Resume uses the native file-input pattern (C7); the honeypot is visually
// offscreen but present in the DOM (R4).

import { useRef } from 'react';
import { Input, Textarea, Checkbox, Button, Stack } from '@/components/ui';
import type { ApplyFormData } from '@/types/public-apply';
import type { ApplyErrors } from './apply-form-helpers';

interface Props {
  data: ApplyFormData;
  errors: ApplyErrors;
  companyName: string;
  set: <K extends keyof ApplyFormData>(field: K, value: ApplyFormData[K]) => void;
  onBlur: (field: keyof ApplyFormData) => void;
}

export default function ApplyFormFields({ data, errors, companyName, set, onBlur }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <Stack gap={16}>
      <Stack gap={12} dir="row" wrap>
        <div style={{ flex: '1 1 160px' }}>
          <Input label="First name" required value={data.firstName} error={errors.firstName}
            onChange={(e) => set('firstName', e.target.value)} onBlur={() => onBlur('firstName')} />
        </div>
        <div style={{ flex: '1 1 160px' }}>
          <Input label="Last name" required value={data.lastName} error={errors.lastName}
            onChange={(e) => set('lastName', e.target.value)} onBlur={() => onBlur('lastName')} />
        </div>
      </Stack>

      <Input label="Email" required type="email" inputMode="email" value={data.email} error={errors.email}
        onChange={(e) => set('email', e.target.value)} onBlur={() => onBlur('email')} />

      <Input label="Phone" type="text" inputMode="tel" value={data.phone} error={errors.phone}
        onChange={(e) => set('phone', e.target.value)} onBlur={() => onBlur('phone')} />

      <div>
        <p style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--ink-muted)', marginBottom: 6 }}>Resume (PDF) *</p>
        <Stack gap={8} dir="row" align="center" wrap>
          <Button type="button" variant="secondary" onClick={() => fileRef.current?.click()}>
            {data.resume ? 'Change file' : 'Choose PDF'}
          </Button>
          {data.resume && <span style={{ fontSize: '0.85rem', color: 'var(--ink)' }}>{data.resume.name}</span>}
        </Stack>
        <input ref={fileRef} type="file" accept="application/pdf,.pdf" hidden
          onChange={(e) => { set('resume', e.target.files?.[0] ?? null); onBlur('resume'); }} />
        {errors.resume && <p role="alert" style={{ color: 'var(--danger)', fontSize: '0.78rem', marginTop: 5 }}>{errors.resume}</p>}
      </div>

      <Textarea label="Cover note" rows={4} value={data.coverNote}
        placeholder="Why are you interested in this role?" onChange={(e) => set('coverNote', e.target.value)} />

      <div>
        <Checkbox checked={data.consent_dpdp} onChange={(v) => set('consent_dpdp', v)}
          label={`I agree to JobMesh and ${companyName} processing my data for recruitment purposes.`} />
        {errors.consent_dpdp && <p role="alert" style={{ color: 'var(--danger)', fontSize: '0.78rem', marginTop: 5 }}>{errors.consent_dpdp}</p>}
        <a href="/legal/privacy" target="_blank" rel="noreferrer" style={{ fontSize: '0.8rem', color: 'var(--link)', display: 'inline-block', marginTop: 4 }}>
          Read the Privacy Notice
        </a>
      </div>

      <Checkbox checked={data.consent_futureOpportunities} onChange={(v) => set('consent_futureOpportunities', v)}
        label={`I'm open to being contacted about future roles at ${companyName}.`} />

      {/* Honeypot — offscreen (not display:none) so bots fill it but humans/AT skip it (R4). */}
      <input
        type="text" name="website_url" tabIndex={-1} autoComplete="off" aria-hidden
        value={data.honeypot ?? ''} onChange={(e) => set('honeypot', e.target.value)}
        style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }}
      />
    </Stack>
  );
}
