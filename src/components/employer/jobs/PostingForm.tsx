'use client';
// FILE: src/components/employer/jobs/PostingForm.tsx
// Reusable create/edit posting form. Owns local field state, validates client-
// side (mirroring the backend), maps server error codes per field, and calls
// onSubmit with the typed payload. Double submit is blocked both visually
// (disabled button) and logically (a synchronous ref guard — state is stale in
// the click closure during a rapid double-click) (R1).

import { useMemo, useRef, useState } from 'react';
import { Input, Button, Alert, Stack } from '@/components/ui';
import { PillToggleGroup } from './PillToggle';
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
  /** Fired on every field change — feeds the New page's live preview. */
  onValuesChange?: (values: PostingFormValues) => void;
}

const WORKPLACE_OPTIONS = [
  { value: 'remote', label: 'Remote' }, { value: 'hybrid', label: 'Hybrid' }, { value: 'onsite', label: 'On-site' },
];
// Internship stays as a fourth pill — dropping it would remove the ability to
// create internship postings (the API value set is unchanged).
const EMPLOYMENT_OPTIONS = [
  { value: 'full-time', label: 'Full-time' }, { value: 'part-time', label: 'Part-time' },
  { value: 'contract', label: 'Contract' }, { value: 'internship', label: 'Internship' },
];

export default function PostingForm({ initialValues, submitLabel, onSubmit, onCancel, onValuesChange }: Props) {
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
    setValues((previous) => {
      const next = { ...previous, [key]: value };
      onValuesChange?.(next);
      return next;
    });

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

      <Stack gap={16} dir="row" wrap>
        <PillToggleGroup
          label="Workplace" options={WORKPLACE_OPTIONS} value={values.workplaceType} error={errors.workplaceType}
          onChange={(value) => setField('workplaceType', value as PostingFormValues['workplaceType'])}
        />
        <PillToggleGroup
          label="Employment type" options={EMPLOYMENT_OPTIONS} value={values.employmentType} error={errors.employmentType}
          onChange={(value) => setField('employmentType', value as PostingFormValues['employmentType'])}
        />
      </Stack>

      <Input
        label="Location" required maxLength={200} value={values.location} error={errors.location}
        onKeyDown={submitOnEnter} onChange={(event) => setField('location', event.target.value)}
      />

      <div>
        <p style={{ fontSize: TYPE.sm, fontWeight: 500, color: 'var(--ink-muted)', marginBottom: 6 }}>
          Salary (₹ LPA, optional)
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Input
            type="number" placeholder="Min" inputMode="numeric" aria-label="Salary minimum" value={values.salaryMinStr}
            onKeyDown={submitOnEnter} onBlur={handleSalaryBlur}
            onChange={(event) => setField('salaryMinStr', event.target.value)}
          />
          <Input
            type="number" placeholder="Max" inputMode="numeric" aria-label="Salary maximum" value={values.salaryMaxStr}
            onKeyDown={submitOnEnter} onBlur={handleSalaryBlur}
            onChange={(event) => setField('salaryMaxStr', event.target.value)}
          />
        </div>
        {errors.salary && (
          <p role="alert" style={{ color: 'var(--danger)', fontSize: TYPE.xs, marginTop: 5, fontWeight: 500 }}>
            {errors.salary}
          </p>
        )}
      </div>

      <div style={{ borderTop: '0.5px solid var(--border)', paddingTop: 14 }}>
        {/* Label row is a flex row so the AI-generate button can slot in later
            without restructuring. */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }} />
        <JobDescriptionTextarea
          label="Job description" required value={values.description} error={errors.description}
          hint={descriptionHint}
          style={{ resize: 'vertical' }}
          placeholder="Describe the role, responsibilities, requirements, and what you offer..."
          minRows={9} maxRows={12} /* caps at ~300px; longer JDs scroll inside */
          onFocus={() => setIsDescriptionFocused(true)} onBlur={() => setIsDescriptionFocused(false)}
          onChange={(event) => setField('description', event.target.value)}
        />
      </div>

      <Stack gap={8} dir="row" wrap>
        <Button onClick={handleSubmit} loading={isSubmitting} disabled={!canSubmit}>{submitLabel}</Button>
        {onCancel && <Button variant="secondary" onClick={onCancel}>Cancel</Button>}
      </Stack>
    </Stack>
  );
}
