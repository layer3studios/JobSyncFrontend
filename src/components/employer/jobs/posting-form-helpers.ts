// FILE: src/components/employer/jobs/posting-form-helpers.ts
// Pure helpers for PostingForm: client-side validation mirroring the backend
// rules (posting-validators.js), payload assembly, and server-error → field
// mapping. Kept separate so the form component stays small and the rules are
// unit-testable in isolation.

import type { PostingCreateInput, WorkplaceType, EmploymentType } from '@/types/employer-jobs';

export interface PostingFormValues {
  title: string;
  description: string;
  location: string;
  workplaceType: WorkplaceType | '';
  employmentType: EmploymentType | '';
  salaryMinStr: string;
  salaryMaxStr: string;
}

export interface PostingFormErrors {
  title?: string;
  description?: string;
  location?: string;
  workplaceType?: string;
  employmentType?: string;
  salary?: string;
  _form?: string;
}

const SCRIPT_PATTERN = /<script/i;
const MAXIMUM_SALARY = 1_000_000_000;
const SALARY_RANGE_MESSAGE = 'Salary must be a whole number between 0 and 1,000,000,000.';

interface SalaryResult { error?: string; salaryMin: number | null; salaryMax: number | null }

/** Parse + range-check both salary inputs. Empty string → null (omitted later). */
export function validateSalaryStrings(salaryMinStr: string, salaryMaxStr: string): SalaryResult {
  const parseOne = (raw: string): { value: number | null; invalid?: boolean } => {
    const trimmed = raw.trim();
    if (trimmed === '') return { value: null };
    const parsed = Number(trimmed);
    if (!Number.isInteger(parsed) || parsed < 0 || parsed > MAXIMUM_SALARY) return { value: null, invalid: true };
    return { value: parsed };
  };
  const min = parseOne(salaryMinStr);
  const max = parseOne(salaryMaxStr);
  if (min.invalid || max.invalid) return { error: SALARY_RANGE_MESSAGE, salaryMin: null, salaryMax: null };
  if (min.value != null && max.value != null && min.value > max.value) {
    return { error: 'Minimum salary must be less than or equal to maximum.', salaryMin: min.value, salaryMax: max.value };
  }
  return { salaryMin: min.value, salaryMax: max.value };
}

/** Full client-side validation; returns an errors object ({} when valid). */
export function validatePostingFormValues(values: PostingFormValues): PostingFormErrors {
  const errors: PostingFormErrors = {};
  const title = values.title.trim();
  if (title.length < 2 || title.length > 200 || SCRIPT_PATTERN.test(title)) {
    errors.title = 'Enter a job title (2–200 characters, no scripts).';
  }
  const description = values.description.trim();
  if (description.length < 50 || description.length > 50000 || SCRIPT_PATTERN.test(description)) {
    errors.description = 'Description must be 50–50,000 characters of plain text.';
  }
  const location = values.location.trim();
  if (location.length < 1 || location.length > 200) errors.location = 'Enter a location.';
  if (values.workplaceType === '') errors.workplaceType = 'Select a workplace type.';
  if (values.employmentType === '') errors.employmentType = 'Select an employment type.';
  const salary = validateSalaryStrings(values.salaryMinStr, values.salaryMaxStr);
  if (salary.error) errors.salary = salary.error;
  return errors;
}

/** Build the typed payload; omits salary keys entirely when empty (R4). */
export function buildPostingInput(values: PostingFormValues): PostingCreateInput {
  const { salaryMin, salaryMax } = validateSalaryStrings(values.salaryMinStr, values.salaryMaxStr);
  const input: PostingCreateInput = {
    title: values.title.trim(),
    description: values.description.trim(),
    location: values.location.trim(),
    workplaceType: values.workplaceType as WorkplaceType,
    employmentType: values.employmentType as EmploymentType,
  };
  if (salaryMin != null) input.salaryMin = salaryMin;
  if (salaryMax != null) input.salaryMax = salaryMax;
  return input;
}

/** Map a backend error code to the field it belongs to (R3). */
export function mapServerErrorToFields(code: string | null, message: string): PostingFormErrors {
  switch (code) {
    case 'INVALID_TITLE': return { title: message };
    case 'INVALID_DESCRIPTION': return { description: message };
    case 'INVALID_LOCATION': return { location: message };
    case 'INVALID_WORKPLACE_TYPE': return { workplaceType: message };
    case 'INVALID_EMPLOYMENT_TYPE': return { employmentType: message };
    case 'INVALID_SALARY': return { salary: message };
    default: return { _form: message || 'Could not save posting. Please try again.' };
  }
}
