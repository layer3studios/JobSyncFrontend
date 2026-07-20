import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  listMembers, listInvites, createInvite, revokeInvite, resendInvite,
  patchMember, removeMember, transferFounder, EmployerTeamApiError,
} from '@/api/employer-team-api';

function mockFetch(status: number, body: unknown) {
  const fetchMock = vi.fn((_url: string, _init?: RequestInit) => Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as unknown as Response));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('employer-team-api', () => {
  beforeEach(() => vi.unstubAllGlobals());

  it('listMembers resolves the array and sends credentials', async () => {
    const fetchMock = mockFetch(200, { members: [{ id: 'm1' }] });
    const members = await listMembers();
    expect(members).toEqual([{ id: 'm1' }]);
    expect(fetchMock.mock.calls[0][1]).toMatchObject({ credentials: 'include' });
  });

  it('listMembers maps 401 → UNAUTHORIZED and 403 → FORBIDDEN', async () => {
    mockFetch(401, {});
    await expect(listMembers()).rejects.toMatchObject({ code: 'UNAUTHORIZED', status: 401 });
    mockFetch(403, {});
    await expect(listMembers()).rejects.toMatchObject({ code: 'FORBIDDEN', status: 403 });
  });

  it('listInvites resolves the array; 403 → FORBIDDEN', async () => {
    mockFetch(200, { invites: [{ id: 'i1' }] });
    expect(await listInvites()).toEqual([{ id: 'i1' }]);
    mockFetch(403, {});
    await expect(listInvites()).rejects.toBeInstanceOf(EmployerTeamApiError);
  });

  it('createInvite returns { invite, inviteUrl }', async () => {
    mockFetch(201, { invite: { id: 'i1', email: 'a@b.com' }, inviteUrl: 'https://x/y' });
    const result = await createInvite({ email: 'a@b.com', role: 'member' });
    expect(result.inviteUrl).toBe('https://x/y');
    expect(result.invite.id).toBe('i1');
  });

  it('createInvite 409 ALREADY_MEMBER throws with the code', async () => {
    mockFetch(409, { code: 'ALREADY_MEMBER', error: 'already' });
    await expect(createInvite({ email: 'a@b.com', role: 'member' }))
      .rejects.toMatchObject({ code: 'ALREADY_MEMBER' });
  });

  it('createInvite 409 INVITE_ALREADY_PENDING carries existingInviteId', async () => {
    mockFetch(409, { code: 'INVITE_ALREADY_PENDING', existingInviteId: 'i9', error: 'pending' });
    const err = await createInvite({ email: 'a@b.com', role: 'member' }).catch((e) => e);
    expect(err).toBeInstanceOf(EmployerTeamApiError);
    expect(err.code).toBe('INVITE_ALREADY_PENDING');
    expect(err.existingInviteId).toBe('i9');
  });

  it('revokeInvite happy path; 409 CANNOT_REVOKE_ACCEPTED throws', async () => {
    mockFetch(200, { invite: { id: 'i1', status: 'revoked' } });
    expect((await revokeInvite('i1')).id).toBe('i1');
    mockFetch(409, { code: 'CANNOT_REVOKE_ACCEPTED', error: 'no' });
    await expect(revokeInvite('i1')).rejects.toMatchObject({ code: 'CANNOT_REVOKE_ACCEPTED' });
  });

  it('resendInvite normalizes newInviteUrl; 409 CANNOT_RESEND_NON_PENDING throws', async () => {
    mockFetch(200, { invite: { id: 'i1' }, newInviteUrl: 'https://x/fresh' });
    expect((await resendInvite('i1')).inviteUrl).toBe('https://x/fresh');
    mockFetch(409, { code: 'CANNOT_RESEND_NON_PENDING', error: 'no' });
    await expect(resendInvite('i1')).rejects.toMatchObject({ code: 'CANNOT_RESEND_NON_PENDING' });
  });

  it('patchMember happy path; 400 SELF_ROLE_CHANGE_FORBIDDEN throws', async () => {
    mockFetch(200, { member: { id: 'm1', role: 'owner' } });
    expect((await patchMember('m1', { role: 'owner' })).role).toBe('owner');
    mockFetch(400, { code: 'SELF_ROLE_CHANGE_FORBIDDEN', error: 'no' });
    await expect(patchMember('m1', { role: 'owner' })).rejects.toMatchObject({ code: 'SELF_ROLE_CHANGE_FORBIDDEN' });
  });

  it('removeMember happy path; 403 CANNOT_REMOVE_FOUNDER throws', async () => {
    mockFetch(200, { removed: true, memberId: 'm1' });
    expect(await removeMember('m1')).toMatchObject({ removed: true, memberId: 'm1' });
    mockFetch(403, { code: 'CANNOT_REMOVE_FOUNDER', error: 'no' });
    await expect(removeMember('m1')).rejects.toMatchObject({ code: 'CANNOT_REMOVE_FOUNDER' });
  });

  it('transferFounder happy path; CANNOT_TRANSFER_TO_SELF and TARGET_NOT_OWNER throw', async () => {
    mockFetch(200, { fromMemberId: 'm1', toMemberId: 'm2' });
    expect(await transferFounder('m2')).toMatchObject({ fromMemberId: 'm1', toMemberId: 'm2' });
    mockFetch(400, { code: 'CANNOT_TRANSFER_TO_SELF', error: 'no' });
    await expect(transferFounder('m1')).rejects.toMatchObject({ code: 'CANNOT_TRANSFER_TO_SELF' });
    mockFetch(400, { code: 'TARGET_NOT_OWNER', error: 'no' });
    await expect(transferFounder('m3')).rejects.toMatchObject({ code: 'TARGET_NOT_OWNER' });
  });
});
