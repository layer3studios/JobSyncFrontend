// FILE: src/api/employer-api.ts
// Thin client for the employer company endpoints (/api/employer/company). Sends
// the employer auth cookie, reads the { company } body, throws EmployerApiError
// (status + code) on any non-2xx. Employer pages call only this module.
// Cookie handling (client): credentials:'include' → the browser attaches jm_employer_token.
// Paths route through API_BASE (C10); real URL is unchanged from the Vite app.

import { apiUrl } from '../lib/api-base';
import type { EmployerCompany } from '../context/employer/employer-context-types';

export class EmployerApiError extends Error {
  status: number;
  code: string | null;

  constructor(status: number, code: string | null, message: string) {
    super(message);
    this.name = 'EmployerApiError';
    this.status = status;
    this.code = code;
  }
}

export interface CreateEmployerCompanyInput {
  name: string;
  website?: string;
  retentionDays?: number;
}

export interface UpdateEmployerCompanyPatch {
  name?: string;
  website?: string | null;
  retentionDays?: number;
  privacyPolicyUrl?: string | null;
  dpoEmail?: string | null;
}

interface CompanyEnvelope {
  company: EmployerCompany;
}

async function request(path: string, init?: RequestInit): Promise<CompanyEnvelope> {
  const response = await fetch(apiUrl(path), {
    credentials: 'include',
    headers: init?.body ? { 'Content-Type': 'application/json' } : undefined,
    ...init,
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new EmployerApiError(
      response.status,
      body?.code ?? null,
      body?.error || `Request failed (${response.status})`,
    );
  }
  return body as CompanyEnvelope;
}

export async function createEmployerCompany(
  input: CreateEmployerCompanyInput,
): Promise<EmployerCompany> {
  const body = await request('/employer/company', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return body.company;
}

export async function updateEmployerCompany(
  patch: UpdateEmployerCompanyPatch,
): Promise<EmployerCompany> {
  const body = await request('/employer/company', {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
  return body.company;
}

export async function fetchEmployerCompany(): Promise<EmployerCompany> {
  const body = await request('/employer/company');
  return body.company;
}
