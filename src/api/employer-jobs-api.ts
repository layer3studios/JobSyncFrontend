// FILE: src/api/employer-jobs-api.ts
// Typed client for the native posting endpoints (/api/employer/jobs). Sends the
// employer auth cookie, reads the { posting } / { postings } body, throws
// EmployerJobsApiError (status + code) on any non-2xx.
// Cookie handling (client): credentials:'include' → the browser attaches jm_employer_token.
// Paths route through API_BASE (C10); real URL is unchanged from the Vite app.

import { apiUrl } from '../lib/api-base';
import type {
  Posting, PostingStatus, PostingCreateInput, PostingPatch,
} from '../types/employer-jobs';

export class EmployerJobsApiError extends Error {
  status: number;
  code: string | null;

  constructor(status: number, code: string | null, message: string) {
    super(message);
    this.name = 'EmployerJobsApiError';
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
    throw new EmployerJobsApiError(
      response.status,
      body?.code ?? null,
      body?.error || `Request failed (${response.status})`,
    );
  }
  return body as T;
}

const postingPath = (postingId: string) => `/employer/jobs/${encodeURIComponent(postingId)}`;

// Omits ?status= entirely when status is undefined ('all' tab) — the backend
// rejects status=all with INVALID_STATUS (R3).
export async function listEmployerPostings(
  { status }: { status?: PostingStatus } = {},
): Promise<Posting[]> {
  const query = status ? `?status=${encodeURIComponent(status)}` : '';
  const body = await request<{ postings: Posting[] }>(`/employer/jobs${query}`);
  return body.postings;
}

export async function getEmployerPosting(postingId: string): Promise<Posting> {
  const body = await request<{ posting: Posting }>(postingPath(postingId));
  return body.posting;
}

export async function createEmployerPosting(input: PostingCreateInput): Promise<Posting> {
  const body = await request<{ posting: Posting }>('/employer/jobs', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return body.posting;
}

export async function updateEmployerPosting(postingId: string, patch: PostingPatch): Promise<Posting> {
  const body = await request<{ posting: Posting }>(postingPath(postingId), {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
  return body.posting;
}

export async function closeEmployerPosting(postingId: string): Promise<Posting> {
  const body = await request<{ posting: Posting }>(`${postingPath(postingId)}/close`, { method: 'POST' });
  return body.posting;
}

export async function reopenEmployerPosting(postingId: string): Promise<Posting> {
  const body = await request<{ posting: Posting }>(`${postingPath(postingId)}/reopen`, { method: 'POST' });
  return body.posting;
}
