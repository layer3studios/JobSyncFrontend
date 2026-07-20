// FILE: src/lib/team-permissions.ts
// Client-side VIEW logic for team actions — decides which buttons to show. The
// backend is the actual gate (require-company-role-middleware + the service rules);
// these functions only keep the UI from offering an action the backend would 403.
import type { Role } from '../types/employer-team';

const isOwnerOrHigher = (role: Role): boolean => role === 'founder' || role === 'owner';

/** Frontend visibility only — backend enforces truth. Founder/Owner may invite. */
export function canInvite(currentRole: Role): boolean {
  return isOwnerOrHigher(currentRole);
}

/**
 * Frontend visibility only — backend enforces truth. Owner+ may remove any
 * non-Founder; anyone may remove themselves unless they are the Founder.
 */
export function canRemove(currentRole: Role, targetRole: Role, isSelf: boolean): boolean {
  if (targetRole === 'founder') return false; // Founder is never removable here (D_impl_ui_8)
  if (isSelf) return true; // self-leave for any non-Founder role (D3)
  return isOwnerOrHigher(currentRole);
}

/**
 * Frontend visibility only — backend enforces truth. Owner+ may change a
 * non-Founder's role, but never their own (SELF_ROLE_CHANGE_FORBIDDEN).
 */
export function canChangeRole(currentRole: Role, targetRole: Role, isSelf: boolean): boolean {
  if (isSelf) return false;
  if (targetRole === 'founder') return false;
  return isOwnerOrHigher(currentRole);
}

/**
 * Frontend visibility only — backend enforces truth. Only the current Founder may
 * transfer, and only to an existing Owner (D_impl_ui_3).
 */
export function canTransferFounder(currentRole: Role, targetRole: Role): boolean {
  return currentRole === 'founder' && targetRole === 'owner';
}
