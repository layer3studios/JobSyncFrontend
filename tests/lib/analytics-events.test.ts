import { describe, it, expect, vi, beforeEach } from 'vitest';

// Control the PostHog client the event layer talks to.
let client: { capture: ReturnType<typeof vi.fn> } | null = null;
vi.mock('@/lib/posthog', () => ({
  getPostHogClient: () => client,
}));

import { trackEvent } from '@/lib/analytics-events';
import { scoreToDecile } from '@/lib/score-decile';

describe('lib/analytics-events — trackEvent', () => {
  beforeEach(() => { client = null; vi.clearAllMocks(); });

  it('no-ops when PostHog is not initialised (no consent)', () => {
    client = null;
    expect(() => trackEvent('job_viewed', { jobId: 'j1', fromRoute: '(direct)' })).not.toThrow();
    // Nothing to assert beyond "did not throw / no client" — there is no client to call.
  });

  it('captures the event with properties when the client exists', () => {
    const capture = vi.fn();
    client = { capture };
    trackEvent('apply_started', { jobId: 'j1', companyId: 'acme', applyMethod: 'public' });
    expect(capture).toHaveBeenCalledWith('apply_started', { jobId: 'j1', companyId: 'acme', applyMethod: 'public' });
  });

  it('never throws even if capture throws', () => {
    client = { capture: vi.fn(() => { throw new Error('boom'); }) };
    expect(() => trackEvent('seeker_logged_out', { fromRoute: '/jobs' })).not.toThrow();
  });

  it('strips personal-data-shaped keys defensively before sending', () => {
    const capture = vi.fn();
    client = { capture };
    // Off-schema object with PII keys — the generic sink must drop them.
    trackEvent('job_viewed', { jobId: 'j1', fromRoute: '(direct)', email: 'x@y.z', phone: '999', name: 'Ada' } as never);
    const sent = capture.mock.calls[0][1];
    expect(sent.jobId).toBe('j1');
    expect(sent.email).toBeUndefined();
    expect(sent.phone).toBeUndefined();
    expect(sent.name).toBeUndefined();
  });
});

describe('lib/score-decile — scoreToDecile', () => {
  it('returns unscored for null/undefined', () => {
    expect(scoreToDecile(null)).toBe('unscored');
    expect(scoreToDecile(undefined)).toBe('unscored');
  });
  it('buckets a score into its decile', () => {
    expect(scoreToDecile(0)).toBe(0);
    expect(scoreToDecile(45)).toBe(4);
    expect(scoreToDecile(99)).toBe(9);
    expect(scoreToDecile(100)).toBe(9); // clamped
  });
});
