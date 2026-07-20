// FILE: src/api/admin-api.ts
// Thin client for the admin endpoints (/api/admin/*). Sends the seeker auth
// cookie, unwraps the { data } envelope, throws AdminApiError (status + code) on
// any non-2xx. Admin pages call only this module.
// Cookie handling (client): credentials:'include' → the browser attaches tj_token.
// Paths route through API_BASE (C10); real URL is unchanged from the Vite app.

import { apiUrl } from '../lib/api-base';

export class AdminApiError extends Error {
  status: number;
  code: string | null;

  constructor(status: number, code: string | null, message: string) {
    super(message);
    this.name = 'AdminApiError';
    this.status = status;
    this.code = code;
  }
}

export interface EmployerAccessWhitelistEntry {
  email: string;
  note: string | null;
  addedAt: string;
}

export interface EmployerAccessState {
  isEmployerSignupOpen: boolean;
  whitelist: EmployerAccessWhitelistEntry[];
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(apiUrl(path), {
    credentials: 'include',
    headers: init?.body ? { 'Content-Type': 'application/json' } : undefined,
    ...init,
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new AdminApiError(
      response.status,
      body?.code ?? null,
      body?.error || `Request failed (${response.status})`,
    );
  }
  return body.data as T;
}

export function fetchEmployerAccess(): Promise<EmployerAccessState> {
  return request<EmployerAccessState>('/admin/employer-access');
}

export function setEmployerSignupOpen(
  isOpen: boolean,
): Promise<{ isEmployerSignupOpen: boolean; updatedAt: string }> {
  return request('/admin/employer-access/toggle', {
    method: 'POST',
    body: JSON.stringify({ isEmployerSignupOpen: isOpen }),
  });
}

export function addWhitelistEntry(
  email: string,
  note?: string,
): Promise<EmployerAccessWhitelistEntry> {
  return request<EmployerAccessWhitelistEntry>('/admin/employer-access/whitelist', {
    method: 'POST',
    body: JSON.stringify({ email, note }),
  });
}

export function removeWhitelistEntry(email: string): Promise<{ deleted: true }> {
  return request(`/admin/employer-access/whitelist/${encodeURIComponent(email)}`, {
    method: 'DELETE',
  });
}
