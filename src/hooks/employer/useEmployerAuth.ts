'use client';
// FILE: src/hooks/employer/useEmployerAuth.ts
// Employer auth state (cookie session). Mirrors useSeekerAuth but talks to the
// /api/employer/auth/* endpoints, stores employerUser, and maps login failures
// into typed error kinds so the UI can distinguish gated vs network vs invalid.
//
// Server-seeded hybrid (D3/D_impl_1): when the (employer) guard layout passes
// `seed` (already-fetched /employer/auth/me payload), we initialize from it and
// SKIP the client mount refresh — no session-loading flash.

import { useState, useEffect, useCallback } from 'react';
import { googleLogout } from '@react-oauth/google';
import type {
  EmployerUser, EmployerCompany, EmployerLoginError,
} from '../../context/employer/employer-context-types';
import { trackEvent } from '../../lib/analytics-events';
import { isFirstSeen } from '../../lib/first-seen';

const GATED_FALLBACK = 'Employer signup is not yet open.';
const INVALID_MESSAGE = 'We could not verify your Google account. Please try again.';
const NETWORK_MESSAGE = 'Network error. Check your connection and try again.';
const UNKNOWN_MESSAGE = 'Something went wrong while signing in. Please try again.';

interface Seed { employerUser: EmployerUser | null; company: EmployerCompany | null }

export function useEmployerAuth(seed?: Seed) {
  const isSeeded = seed !== undefined;
  const [employerUser, setEmployerUser] = useState<EmployerUser | null>(seed?.employerUser ?? null);
  const [company, setCompany] = useState<EmployerCompany | null>(seed?.company ?? null);
  const [isLoading, setIsLoading] = useState(!isSeeded);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [loginError, setLoginError] = useState<EmployerLoginError | null>(null);

  // Re-fetch /me and set employerUser + company together. The /me payload (3A)
  // carries both, so one round trip keeps them in sync (C10). A non-ok response
  // (or network failure) means no live session: clear both.
  const refreshEmployerSession = useCallback(async () => {
    try {
      const response = await fetch('/api/employer/auth/me', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setEmployerUser(data.employerUser ?? null);
        setCompany(data.company ?? null);
      } else {
        setEmployerUser(null);
        setCompany(null);
      }
    } catch {
      setEmployerUser(null);
      setCompany(null);
    }
  }, []);

  // Initial session check. A 401 is the normal "not logged in" case — no error.
  // Skipped when the server seeded us (D_impl_1).
  useEffect(() => {
    if (isSeeded) return;
    refreshEmployerSession().finally(() => setIsLoading(false));
  }, [isSeeded, refreshEmployerSession]);

  const login = useCallback(async (credential: string) => {
    setIsAuthenticating(true);
    setLoginError(null);
    try {
      let response: Response;
      try {
        response = await fetch('/api/employer/auth/google', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ credential }),
        });
      } catch {
        setLoginError({ kind: 'network', message: NETWORK_MESSAGE });
        return;
      }

      if (response.ok) {
        const data = await response.json();
        // /google only returns employerUser; refresh pulls company from /me so a
        // returning, already-onboarded user lands on the dashboard, not onboarding.
        setEmployerUser(data.employerUser ?? null);
        // No isNewUser flag (D2) — infer signup vs login from first-seen per browser.
        const employerId = data.employerUser?.id ?? '';
        const isSignup = isFirstSeen('employer', employerId);
        trackEvent(isSignup ? 'employer_signup_completed' : 'employer_login_completed', { method: 'google' });
        await refreshEmployerSession();
        return;
      }

      const body = await response.json().catch(() => ({}));
      const code = body?.code;
      if (response.status === 403 && code === 'EMPLOYER_SIGNUP_GATED') {
        setLoginError({ kind: 'gated', message: body?.error || GATED_FALLBACK });
      } else if (
        response.status === 401 &&
        (code === 'INVALID_GOOGLE_TOKEN' || code === 'EMAIL_NOT_VERIFIED')
      ) {
        setLoginError({ kind: 'invalid', message: body?.error || INVALID_MESSAGE });
      } else {
        setLoginError({ kind: 'unknown', message: body?.error || UNKNOWN_MESSAGE });
      }
    } finally {
      setIsAuthenticating(false);
    }
  }, [refreshEmployerSession]);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/employer/auth/logout', { method: 'POST', credentials: 'include' });
    } catch {
      // Logout is best-effort; clear local state regardless of network outcome.
    } finally {
      setEmployerUser(null);
      setCompany(null);
      googleLogout();
    }
  }, []);

  const clearLoginError = useCallback(() => setLoginError(null), []);

  return {
    employerUser,
    setEmployerUser,
    company,
    isLoading,
    isAuthenticating,
    loginError,
    login,
    logout,
    clearLoginError,
    refreshEmployerSession,
  };
}
