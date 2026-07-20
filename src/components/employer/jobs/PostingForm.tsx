'use client';
// FILE: src/components/employer/jobs/PostingForm.tsx
// Reusable create/edit posting form. Owns local field state, validates client-
// side (mirroring the backend), maps server error codes per field, and calls
// onSubmit with the typed payload. Double submit is blocked both visually
// (disabled button) and logically (a synchronous ref guard — state is stale in
// the click closure during a rapid double-click) (R1).

import { useMemo, useRef, useState } from 'react';
import { Input, Select, Button, Badge, Alert, Stack } from '@/components/ui';
import { TYPE } from '@/theme/tokens';
import { JobDescriptionTextarea } from '@/components/employer/JobDescriptionTextarea';
import { EmployerJobsApiError } from '@/api/employer-jobs-api';
import type { PostingCreateInput } from '@/types/employer-jobs';
import {
  validatePostingFormValues, validateSalaryStrings, buildPostingInput, mapServerErrorToFields,
} from '@/components/employer/jobs/posting-form-helpers';
import type { PostingFormValues, PostingFormErrors } from '@/components/employer/jobs/posting-form-helpers';

interface Props {
  initialValues?: Partial<PostingCreateInput>;
  submitLabel: string;
  onSubmit: (input: PostingCreateInput) => Promise<void>;
  onCancel?: () => void;
}

const WORKPLACE_OPTIONS = [
  { value: 'remote', label: 'Remote' }, { value: 'hybrid', label: 'Hybrid' }, { value: 'onsite', label: 'Onsite' },
];
const EMPLOYMENT_OPTIONS = [
  { value: 'full-time', label: 'Full-time' }, { value: 'part-time', label: 'Part-time' },
  { value: 'contract', label: 'Contract' }, { value: 'internship', label: 'Internship' },
];

export default function PostingForm({ initialValues, submitLabel, onSubmit, onCancel }: Props) {
  const [values, setValues] = useState<PostingFormValues>(() => ({
    title: initialValues?.title ?? '',
    description: initialValues?.description ?? '',
    location: initialValues?.location ?? '',
    workplaceType: initialValues?.workplaceType ?? '',
    employmentType: initialValues?.employmentType ?? '',
    salaryMinStr: initialValues?.salaryMin != null ? String(initialValues.salaryMin) : '',
    salaryMaxStr: initialValues?.salaryMax != null ? String(initialValues.salaryMax) : '',
  }));
  const [errors, setErrors] = useState<PostingFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDescriptionFocused, setIsDescriptionFocused] = useState(false);
  const submittingRef = useRef(false);

  const setField = <K extends keyof PostingFormValues>(key: K, value: PostingFormValues[K]) =>
    setValues((previous) => ({ ...previous, [key]: value }));

  const canSubmit = useMemo(() => (
    values.title.trim().length >= 2 && values.description.trim().length >= 50
    && values.location.trim().length >= 1 && values.workplaceType !== ''
    && values.employmentType !== '' && !isSubmitting
  ), [values, isSubmitting]);

  const handleSalaryBlur = () => {
    const { error } = validateSalaryStrings(values.salaryMinStr, values.salaryMaxStr);
    setErrors((previous) => ({ ...previous, salary: error }));
  };

  const handleSubmit = async () => {
    if (submittingRef.current) return; // logical double-submit guard (R1)
    const validationErrors = validatePostingFormValues(values);
    if (Object.keys(validationErrors).length > 0) { setErrors(validationErrors); return; }
    submittingRef.current = true;
    setErrors({});
    setIsSubmitting(true);
    try {
      await onSubmit(buildPostingInput(values));
    } catch (error) {
      setErrors(error instanceof EmployerJobsApiError
        ? mapServerErrorToFields(error.code, error.message)
        : { _form: 'Could not save posting. Please try again.' });
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const submitOnEnter = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') { event.preventDefault(); void handleSubmit(); }
  };

  const descriptionHint = isDescriptionFocused
    ? `${values.description.length} characters — aim for at least 50.`
    : 'Aim for at least 50 characters.';

  return (
    <Stack gap={16}>
      {errors._form && <Alert type="error">{errors._form}</Alert>}

      <Input
        label="Job title" required maxLength={200} value={values.title} error={errors.title}
        onKeyDown={submitOnEnter} onChange={(event) => setField('title', event.target.value)}
      />

      <Stack gap={12} dir="row" wrap>
        <div style={{ flex: '1 1 200px' }}>
          <Select
            label="Workplace type" required placeholder="Select…" options={WORKPLACE_OPTIONS}
            value={values.workplaceType} error={errors.workplaceType}
            onChange={(event) => setField('workplaceType', event.target.value as PostingFormValues['workplaceType'])}
          />
        </div>
        <div style={{ flex: '1 1 200px' }}>
          <Select
            label="Employment type" required placeholder="Select…" options={EMPLOYMENT_OPTIONS}
            value={values.employmentType} error={errors.employmentType}
            onChange={(event) => setField('employmentType', event.target.value as PostingFormValues['employmentType'])}
          />
        </div>
      </Stack>

      <Input
        label="Location" required maxLength={200} value={values.location} error={errors.location}
        onKeyDown={submitOnEnter} onChange={(event) => setField('location', event.target.value)}
      />

      <div>
        <p style={{ fontSize: TYPE.sm, fontWeight: 500, color: 'var(--ink-muted)', marginBottom: 6 }}>
          Salary (annual, optional)
        </p>
        <Stack gap={8} dir="row" align="center" wrap>
          <Input
            type="number" placeholder="Min" inputMode="numeric" value={values.salaryMinStr}
            onKeyDown={submitOnEnter} onBlur={handleSalaryBlur}
            onChange={(event) => setField('salaryMinStr', event.target.value)}
          />
          <Input
            type="number" placeholder="Max" inputMode="numeric" value={values.salaryMaxStr}
            onKeyDown={submitOnEnter} onBlur={handleSalaryBlur}
            onChange={(event) => setField('salaryMaxStr', event.target.value)}
          />
          <Badge variant="neutral">₹ INR</Badge>
        </Stack>
        {errors.salary && (
          <p role="alert" style={{ color: 'var(--danger)', fontSize: TYPE.xs, marginTop: 5, fontWeight: 500 }}>
            {errors.salary}
          </p>
        )}
      </div>

      <JobDescriptionTextarea
        label="Job description" required value={values.description} error={errors.description}
        hint={descriptionHint} placeholder="Paste the full job description here…"
        onFocus={() => setIsDescriptionFocused(true)} onBlur={() => setIsDescriptionFocused(false)}
        onChange={(event) => setField('description', event.target.value)}
      />

      <Stack gap={8} dir="row" wrap>
        <Button onClick={handleSubmit} loading={isSubmitting} disabled={!canSubmit}>{submitLabel}</Button>
        {onCancel && <Button variant="ghost" onClick={onCancel}>Cancel</Button>}
      </Stack>
    </Stack>
  );
}
