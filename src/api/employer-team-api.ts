// FILE: src/api/employer-team-api.ts
// Client for the team roster + invite lifecycle endpoints (feat/team-invites,
// backend chunks 1–3.5). Same shape as employer-api.ts: credentials:'include' so
// the browser attaches jm_employer_token, reads the typed envelope, throws
// EmployerTeamApiError (status + code) on any non-2xx. The client never re-fetches
// auth — it relies on the layout-seeded EmployerContext (C11: a 401 bubbles up as a
// typed error; app-level auth handling takes over, we never re-auth here).
import { apiUrl } from '../lib/api-base';
import type {
  TeamMember, CompanyInvite, Role, InvitableRole,
} from '../types/employer-team';

export class EmployerTeamApiError extends Error {
  status: number;
  code: string | null;
  existingInviteId?: string;
  existingMemberId?: string;

  constructor(
    status: number,
    code: string | null,
    message: string,
    extra?: { existingInviteId?: string; existingMemberId?: string },
  ) {
    super(message);
    this.name = 'EmployerTeamApiError';
    this.status = status;
    this.code = code;
    this.existingInviteId = extra?.existingInviteId;
    this.existingMemberId = extra?.existingMemberId;
  }
}

/** Fallback code for statuses the backend answers without a body code. */
function statusToCode(status: number): string | null {
  if (status === 401) return 'UNAUTHORIZED';
  if (status === 403) return 'FORBIDDEN';
  return null;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(apiUrl(path), {
    credentials: 'include',
    headers: init?.body ? { 'Content-Type': 'application/json' } : undefined,
    ...init,
  });
  const body = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (!response.ok) {
    throw new EmployerTeamApiError(
      response.status,
      (body.code as string | null) ?? statusToCode(response.status),
      (body.error as string) || `Request failed (${response.status})`,
      {
        existingInviteId: body.existingInviteId as string | undefined,
        existingMemberId: body.existingMemberId as string | undefined,
      },
    );
  }
  return body as T;
}

export interface CreateInviteInput {
  email: string;
  role: InvitableRole;
  canMoveApplicants?: boolean;
  canArchiveApplicants?: boolean;
}

export interface MemberPatch {
  role?: InvitableRole;
  canMoveApplicants?: boolean;
  canArchiveApplicants?: boolean;
}

// The PATCH response omits identity fields (name/email/picture) — the caller merges
// these flags into the existing row it already holds.
export interface MemberPatchResult {
  id: string;
  employerUserId: string;
  role: Role;
  isFounder: boolean;
  canMoveApplicants: boolean;
  canArchiveApplicants: boolean;
  joinedAt: string;
}

export interface InviteWithUrl {
  invite: CompanyInvite;
  inviteUrl: string;
}

export async function listMembers(): Promise<TeamMember[]> {
  const body = await request<{ members: TeamMember[] }>('/employer/team/members');
  return body.members;
}

export async function listInvites(): Promise<CompanyInvite[]> {
  const body = await request<{ invites: CompanyInvite[] }>('/employer/team/invites');
  return body.invites;
}

export async function createInvite(input: CreateInviteInput): Promise<InviteWithUrl> {
  const body = await request<{ invite: CompanyInvite; inviteUrl: string }>(
    '/employer/team/invites',
    { method: 'POST', body: JSON.stringify(input) },
  );
  return { invite: body.invite, inviteUrl: body.inviteUrl };
}

export async function revokeInvite(inviteId: string): Promise<CompanyInvite> {
  const body = await request<{ invite: CompanyInvite }>(
    `/employer/team/invites/${inviteId}`,
    { method: 'DELETE' },
  );
  return body.invite;
}

export async function resendInvite(inviteId: string): Promise<InviteWithUrl> {
  // The resend route returns the fresh URL under `newInviteUrl`; normalise it so
  // callers only ever read `inviteUrl`.
  const body = await request<{ invite: CompanyInvite; inviteUrl?: string; newInviteUrl?: string }>(
    `/employer/team/invites/${inviteId}/resend`,
    { method: 'POST' },
  );
  return { invite: body.invite, inviteUrl: body.newInviteUrl ?? body.inviteUrl ?? '' };
}

export async function patchMember(memberId: string, patch: MemberPatch): Promise<MemberPatchResult> {
  const body = await request<{ member: MemberPatchResult }>(
    `/employer/team/members/${memberId}`,
    { method: 'PATCH', body: JSON.stringify(patch) },
  );
  return body.member;
}

export async function removeMember(memberId: string): Promise<{ removed: boolean; memberId: string }> {
  return request<{ removed: boolean; memberId: string }>(
    `/employer/team/members/${memberId}`,
    { method: 'DELETE' },
  );
}

export async function transferFounder(toMemberId: string): Promise<{ fromMemberId: string; toMemberId: string }> {
  return request<{ fromMemberId: string; toMemberId: string }>(
    '/employer/team/transfer-founder',
    { method: 'POST', body: JSON.stringify({ toMemberId }) },
  );
}

export async function acceptInvite(token: string): Promise<{ member: TeamMember; redirectUrl: string }> {
  return request<{ member: TeamMember; redirectUrl: string }>(
    '/employer/team/invites/accept',
    { method: 'POST', body: JSON.stringify({ token }) },
  );
}
