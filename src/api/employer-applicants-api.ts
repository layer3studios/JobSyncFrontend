// FILE: src/api/employer-applicants-api.ts
// Typed client for the employer applicant pipeline endpoints. Sends the employer
// auth cookie and throws EmployerApplicantsApiError (status + code) on any non-2xx.
// Cookie handling (client): credentials:'include' → the browser attaches jm_employer_token.
// Paths route through API_BASE (C10); real URL is unchanged from the Vite app.

import { apiUrl } from '../lib/api-base';
import type {
  Applicant, ApplicantDetail, ApplicantNote, ResumeUrl, Stage, ArchiveReason,
  ApplicantSort, BulkArchiveResult, RescoreResult,
} from '../types/employer-applicants';

export class EmployerApplicantsApiError extends Error {
  status: number;
  code: string | null;

  constructor(status: number, code: string | null, message: string) {
    super(message);
    this.name = 'EmployerApplicantsApiError';
    this.status = status;
    this.code = code;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(apiUrl(path), {
    credentials: 'include',
    headers: init?.body ? { 'Content-Type': 'application/json' } : undefined,
    ...init,
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new EmployerApplicantsApiError(
      response.status,
      body?.code ?? null,
      body?.error || `Request failed (${response.status})`,
    );
  }
  return body as T;
}

const applicantPath = (applicationId: string) => `/employer/applicants/${encodeURIComponent(applicationId)}`;

export async function listApplicantsForPosting(
  postingId: string,
  { sort }: { sort?: ApplicantSort } = {},
): Promise<Applicant[]> {
  const query = sort ? `?sort=${encodeURIComponent(sort)}` : '';
  const body = await request<{ applicants: Applicant[] }>(
    `/employer/jobs/${encodeURIComponent(postingId)}/applicants${query}`,
  );
  return body.applicants;
}

export async function fetchApplicantDetail(applicationId: string): Promise<ApplicantDetail> {
  const body = await request<{ applicant: ApplicantDetail }>(applicantPath(applicationId));
  return body.applicant;
}

export async function refreshResumeUrl(applicationId: string): Promise<ResumeUrl> {
  return request<ResumeUrl>(`${applicantPath(applicationId)}/resume-url`);
}

export async function listStages(): Promise<Stage[]> {
  const body = await request<{ stages: Stage[] }>('/employer/stages');
  return body.stages;
}

export async function listArchiveReasons(): Promise<ArchiveReason[]> {
  const body = await request<{ reasons: ArchiveReason[] }>('/employer/archive-reasons');
  return body.reasons;
}

export async function moveApplicant(
  applicationId: string,
  input: { stageId: string; note?: string },
): Promise<{ application: Applicant['application'] }> {
  return request(`${applicantPath(applicationId)}/move`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function archiveApplicant(
  applicationId: string,
  input: { reasonId: string; note?: string },
): Promise<{ application: Applicant['application'] }> {
  return request(`${applicantPath(applicationId)}/archive`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function unarchiveApplicant(
  applicationId: string,
): Promise<{ application: Applicant['application'] }> {
  return request(`${applicantPath(applicationId)}/unarchive`, { method: 'POST' });
}

/** An application's notes, newest first (C3). Empty array when there are none. */
export async function listApplicantNotes(applicationId: string): Promise<ApplicantNote[]> {
  const body = await request<{ notes: ApplicantNote[] }>(`${applicantPath(applicationId)}/notes`);
  return body.notes;
}

/**
 * Append one note (C3). Throws EmployerApplicantsApiError with code INVALID_NOTE_BODY
 * when the server rejects the body (empty / >4000 chars / not plain text).
 */
export async function createApplicantNote(
  applicationId: string,
  input: { body: string },
): Promise<ApplicantNote> {
  const body = await request<{ note: ApplicantNote }>(`${applicantPath(applicationId)}/notes`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return body.note;
}

/**
 * Requeue AI scoring for one applicant. Resolves on both 202 (a job was reset or
 * inserted) and 200 (one was already in flight — `rescored: false`); the caller
 * distinguishes them via the returned flag rather than the status code.
 */
export async function rescoreApplicant(applicationId: string): Promise<RescoreResult> {
  return request<RescoreResult>(`${applicantPath(applicationId)}/rescore`, { method: 'POST' });
}

/**
 * Bulk-archive many applications (PP1/PP3). Resolves with the per-item outcome body on
 * 200 (including partial success); throws EmployerApplicantsApiError with .code on a
 * whole-request failure (BULK_EMPTY / BULK_LIMIT_EXCEEDED / REASON_NOT_FOUND / 401 / 403).
 */
export async function bulkArchiveApplicants(
  input: { applicationIds: string[]; reasonId: string; note?: string },
): Promise<BulkArchiveResult> {
  return request<BulkArchiveResult>('/employer/applicants/bulk/archive', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
