// FILE: src/api/admin-analytics-api.ts
// Client API module for the admin analytics endpoints. Every call forwards the
// seeker cookie (credentials: 'include') to a RELATIVE /api path (C8/C9). Non-2xx
// throws AdminAnalyticsApiError; a 503 ANALYTICS_DISABLED is detectable via
// isAnalyticsDisabled(). The normalizers are exported so the SSR page (which uses
// server-fetch) can reuse the exact same shaping — one source of truth for field
// names (day→date, device→type variance is absorbed here).
import type {
  SinceRange, VolumeResponse, SeekerResponse, EmployerResponse,
  EngagementResponse, TeamResponse, TrafficResponse,
} from '@/types/admin-analytics';

const BASE = '/api/admin/analytics';

export class AdminAnalyticsApiError extends Error {
  status: number;
  code: string | null;

  constructor(status: number, code: string | null, message: string) {
    super(message);
    this.name = 'AdminAnalyticsApiError';
    this.status = status;
    this.code = code;
  }
}

export function isAnalyticsDisabled(error: unknown): boolean {
  return error instanceof AdminAnalyticsApiError && error.code === 'ANALYTICS_DISABLED';
}

type Row = Record<string, unknown>;
const num = (v: unknown): number => (typeof v === 'number' ? v : Number(v ?? 0) || 0);
const str = (v: unknown): string => (v == null ? '' : String(v));

// Field-name normalizers — absorb backend variance so components see one shape.
const daily = (rows: unknown): { date: string; count: number }[] =>
  (Array.isArray(rows) ? rows : []).map((r: Row) => ({ date: str(r.date ?? r.day), count: num(r.count) }));
const funnel = (rows: unknown): { stage: string; count: number }[] =>
  (Array.isArray(rows) ? rows : []).map((r: Row) => ({ stage: str(r.stage), count: num(r.count) }));
const referrer = (rows: unknown): { bucket: string; count: number }[] =>
  (Array.isArray(rows) ? rows : []).map((r: Row) => ({ bucket: str(r.bucket), count: num(r.count) }));
const device = (rows: unknown): { type: string; count: number }[] =>
  (Array.isArray(rows) ? rows : []).map((r: Row) => ({ type: str(r.type ?? r.device), count: num(r.count) }));
const meta = (r: Row) => ({ cachedAt: str(r.cachedAt), since: str(r.since) });

export const normalizeVolume = (r: Row): VolumeResponse => ({
  ...meta(r), visitorsTotal: num(r.visitorsTotal), pageviewsTotal: num(r.pageviewsTotal),
  visitorsByDay: daily(r.visitorsByDay), pageviewsByDay: daily(r.pageviewsByDay),
});
export const normalizeSeeker = (r: Row): SeekerResponse => ({
  ...meta(r), signups: num(r.signups), logins: num(r.logins), jobsListViews: num(r.jobsListViews),
  jobDetailViews: num(r.jobDetailViews), applyStarted: num(r.applyStarted),
  applySubmitted: num(r.applySubmitted), applySuccessViewed: num(r.applySuccessViewed), funnel: funnel(r.funnel),
});
export const normalizeEmployer = (r: Row): EmployerResponse => ({
  ...meta(r), signups: num(r.signups), logins: num(r.logins), onboardingStarted: num(r.onboardingStarted),
  onboardingCompleted: num(r.onboardingCompleted), postingsCreated: num(r.postingsCreated),
  postingsPublished: num(r.postingsPublished), funnel: funnel(r.funnel),
});
export const normalizeEngagement = (r: Row): EngagementResponse => ({
  ...meta(r), applicantsViewed: num(r.applicantsViewed), applicantsMovedStage: num(r.applicantsMovedStage),
  applicantsArchived: num(r.applicantsArchived), notesAdded: num(r.notesAdded),
});
export const normalizeTeam = (r: Row): TeamResponse => ({
  ...meta(r), invitesSent: num(r.invitesSent), invitesAccepted: num(r.invitesAccepted),
});
export const normalizeTraffic = (r: Row): TrafficResponse => ({
  ...meta(r), byReferrer: referrer(r.byReferrer), byDevice: device(r.byDevice),
});

async function getJson(endpoint: string, since: SinceRange | string): Promise<Row> {
  const res = await fetch(`${BASE}${endpoint}?since=${encodeURIComponent(since)}`, { credentials: 'include' });
  const body = (await res.json().catch(() => ({}))) as Row;
  if (!res.ok) {
    throw new AdminAnalyticsApiError(res.status, (body.code as string) ?? null, (body.error as string) || `Request failed (${res.status})`);
  }
  return body;
}

export const fetchVolume = async (since: SinceRange | string): Promise<VolumeResponse> => normalizeVolume(await getJson('/volume', since));
export const fetchSeeker = async (since: SinceRange | string): Promise<SeekerResponse> => normalizeSeeker(await getJson('/seeker', since));
export const fetchEmployer = async (since: SinceRange | string): Promise<EmployerResponse> => normalizeEmployer(await getJson('/employer', since));
export const fetchEngagement = async (since: SinceRange | string): Promise<EngagementResponse> => normalizeEngagement(await getJson('/engagement', since));
export const fetchTeam = async (since: SinceRange | string): Promise<TeamResponse> => normalizeTeam(await getJson('/team', since));
export const fetchTraffic = async (since: SinceRange | string): Promise<TrafficResponse> => normalizeTraffic(await getJson('/traffic', since));
