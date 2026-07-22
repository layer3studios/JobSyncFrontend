// FILE: src/lib/analytics-events.ts
// Typed custom-event layer over Chunk 1's PostHog client. Every funnel event flows
// through trackEvent(), which:
//   • no-ops when PostHog is not initialised (i.e. consent not granted) — via
//     getPostHogClient() returning null;
//   • never throws (defensive try/catch, warns once);
//   • strips any personal-data-shaped keys before sending (belt-and-suspenders — the
//     typed schemas below already exclude PII; D7/C8).
// Event names are past-tense verb_noun snake_case; property names are camelCase (D5/D6).
import { getPostHogClient } from './posthog';

type ApplyMethod = 'public' | 'seeker_authenticated';
type AuthMethod = 'google';
type MoveMethod = 'drag' | 'select';
type ScoreDecile = number | 'unscored';
type FilterType = 'search' | 'company' | 'role' | 'exp' | 'wp' | 'date' | 'entry' | 'newOnly' | 'hideApplied' | 'sort';
type FilterAction = 'added' | 'removed';
type InviteStatus = 'valid' | 'expired' | 'revoked' | 'accepted';
type InvitableRoleName = 'owner' | 'member' | 'interviewer';

// The single source of truth: event name → property shape. Adding/renaming a property
// is a compile-time break at every call site (no `any`, no `unknown`).
export interface EventPropertyMap {
  // Funnel 1 — Seeker Apply
  job_viewed: { jobId: string; company?: string; jobSlug?: string; fromRoute: string };
  apply_started: { jobId: string; companyId?: string; applyMethod: ApplyMethod };
  apply_form_field_focused: { jobId: string; fieldName: string };
  apply_submitted: { jobId: string; companyId?: string; applyMethod: ApplyMethod; hasResume: boolean; hasCoverNote: boolean };
  apply_success_viewed: { jobId?: string; companyId?: string; companySlug?: string };
  // Funnel 2 — Seeker Job Discovery
  jobs_list_viewed: { totalResults: number; filterCount: number };
  jobs_filter_applied: { filterType: FilterType; action: FilterAction };
  jobs_search_query_entered: { queryLength: number };
  jobs_result_clicked: { jobId: string; positionInList: number; fromRoute: string };
  // Funnel 3 — Seeker Signup + Auth
  seeker_signup_started: { fromRoute: string };
  seeker_signup_completed: { method: AuthMethod };
  seeker_login_completed: { method: AuthMethod };
  seeker_logged_out: { fromRoute: string };
  // Funnel 4 — Employer Signup + First Job
  employer_signup_started: { fromRoute: string };
  employer_signup_completed: { method: AuthMethod };
  employer_login_completed: { method: AuthMethod };
  onboarding_started: Record<string, never>;
  onboarding_completed: { companySize?: string; industry?: string };
  posting_form_opened: { fromRoute: string };
  posting_created: { postingId: string; isDraft: boolean; isPublished: boolean };
  posting_published: { postingId: string };
  // Funnel 5 — Employer Applicant Actions
  applicant_viewed: { applicationId: string; postingId: string; companyId?: string; scoreDecile: ScoreDecile };
  applicant_moved_stage: { applicationId: string; postingId: string; companyId?: string; fromStage: string; toStage: string; method: MoveMethod };
  applicant_archived: { applicationId: string; postingId: string; companyId?: string; archiveReason: string; isBulk: boolean };
  applicant_rescored: { applicationId: string; postingId: string; companyId?: string };
  note_added: { applicationId: string; postingId: string; companyId?: string; noteLength: number };
  // Funnel 6 — Team Invites (feature not yet built; schemas defined for Chunk 5)
  team_page_viewed: { memberCount: number; pendingInviteCount: number };
  invite_form_opened: Record<string, never>;
  invite_sent: { role: string; canMove: boolean; canArchive: boolean };
  invite_link_copied: { role: string };
  invite_preview_viewed: { role: string; status: InviteStatus };
  invite_accepted: { role: string; wasAlreadyMember: boolean };
  member_role_changed: { fromRole: string; toRole: string; targetIsSelf: boolean };
  member_removed: { targetIsSelf: boolean };
  founder_transferred: Record<string, never>;
  // Admin-analytics reconciliation events — the plural/team_-prefixed names the backend
  // HogQL queries count (fix/analytics-event-name-reconciliation). They coexist with the
  // legacy singular events above until those are retired.
  // PII-safe: identifiers + enum only
  applicants_viewed: { companyId: string; applicantId: string; jobId: string };
  // PII-safe: identifiers + enum only
  applicants_moved_stage: { companyId: string; applicantId: string; jobId: string; fromStage: string; toStage: string };
  // PII-safe: identifiers + enum only (reasonId is an internal id — never the reason text)
  applicants_archived: { companyId: string; applicantId: string; jobId: string; reasonId?: string };
  // PII-safe: identifiers + enum only
  team_invite_sent: { companyId: string; inviteId: string; role: InvitableRoleName; canMoveApplicants: boolean; canArchiveApplicants: boolean };
  // PII-safe: identifiers + enum only (inviteId optional — the accept flow never sees it; C2 sanitizes)
  team_invite_accepted: { companyId: string; inviteId?: string; role: InvitableRoleName };
}

export type AnalyticsEvent = keyof EventPropertyMap;

// Defensive PII blocklist (lower-cased). The typed schemas never include these, but a
// generic sink must never leak them even if a caller passes an off-schema object.
const PII_KEYS = new Set([
  'email', 'phone', 'name', 'fullname', 'firstname', 'lastname',
  'resume', 'resumeurl', 'address', 'password', 'credential', 'querytext',
]);

let hasWarned = false;

function stripPii(properties: Record<string, unknown>): Record<string, unknown> {
  const safe: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(properties)) {
    if (PII_KEYS.has(key.toLowerCase())) continue;
    safe[key] = value;
  }
  return safe;
}

export function trackEvent<E extends AnalyticsEvent>(event: E, properties?: EventPropertyMap[E]): void {
  try {
    const client = getPostHogClient();
    if (!client) return; // not initialised → no consent → no-op
    const safe = properties ? stripPii(properties as Record<string, unknown>) : undefined;
    client.capture(event, safe);
  } catch (err) {
    if (!hasWarned) {
      hasWarned = true;
      console.warn('[analytics] trackEvent failed', err);
    }
  }
}
