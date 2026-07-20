import { describe, it, expect } from 'vitest';
import { canInvite, canRemove, canChangeRole, canTransferFounder } from '@/lib/team-permissions';

describe('canInvite', () => {
  it('is true for Founder/Owner, false for Member/Interviewer', () => {
    expect(canInvite('founder')).toBe(true);
    expect(canInvite('owner')).toBe(true);
    expect(canInvite('member')).toBe(false);
    expect(canInvite('interviewer')).toBe(false);
  });
});

describe('canRemove', () => {
  it('lets Founder/Owner remove non-Founders', () => {
    expect(canRemove('founder', 'owner', false)).toBe(true);
    expect(canRemove('owner', 'member', false)).toBe(true);
  });
  it('allows self-remove for non-Founder roles', () => {
    expect(canRemove('member', 'member', true)).toBe(true);
    expect(canRemove('interviewer', 'interviewer', true)).toBe(true);
  });
  it('never allows removing a Founder, including self', () => {
    expect(canRemove('owner', 'founder', false)).toBe(false);
    expect(canRemove('founder', 'founder', true)).toBe(false);
  });
  it('denies non-owners removing others', () => {
    expect(canRemove('member', 'interviewer', false)).toBe(false);
  });
});

describe('canChangeRole', () => {
  it('is true for Founder/Owner on a non-Founder, non-self target', () => {
    expect(canChangeRole('founder', 'owner', false)).toBe(true);
    expect(canChangeRole('owner', 'member', false)).toBe(true);
  });
  it('is false for self, Founder target, or insufficient role', () => {
    expect(canChangeRole('owner', 'member', true)).toBe(false);
    expect(canChangeRole('owner', 'founder', false)).toBe(false);
    expect(canChangeRole('member', 'interviewer', false)).toBe(false);
  });
});

describe('canTransferFounder', () => {
  it('is true only when self is Founder and target is Owner', () => {
    expect(canTransferFounder('founder', 'owner')).toBe(true);
  });
  it('is false otherwise', () => {
    expect(canTransferFounder('owner', 'owner')).toBe(false);
    expect(canTransferFounder('founder', 'member')).toBe(false);
    expect(canTransferFounder('founder', 'interviewer')).toBe(false);
  });
});
