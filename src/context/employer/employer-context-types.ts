// FILE: src/context/employer/employer-context-types.ts
// Shared types for the employer auth context. Kept separate from the seeker
// types — employer and seeker are independent audiences (NAMING §0).

export interface EmployerUser {
  id: string;
  email: string;
  name: string;
  picture: string | null;
  companyId: string | null; // null until company onboarding (Step 3)
}

export type EmployerLoginErrorKind = 'gated' | 'network' | 'invalid' | 'unknown';

export interface EmployerLoginError {
  kind: EmployerLoginErrorKind;
  message: string;
}

// The caller's company, as projected by the backend's toPublicCompany (3A).
// Populated from the /api/employer/auth/me payload alongside employerUser.
export interface EmployerCompany {
  id: string;
  slug: string;
  name: string;
  website: string | null;
  logoUrl: string | null;
  plan: 'free' | 'paid';
  retentionDays: number;
  privacyPolicyUrl: string | null;
  dpoEmail: string | null;
  createdAt: string;
}

export interface EmployerCtx {
  employerUser: EmployerUser | null;
  company: EmployerCompany | null;     // null until onboarding completes (Step 3B)
  isLoading: boolean;          // initial /me check in flight
  isAuthenticating: boolean;   // login POST in flight
  loginError: EmployerLoginError | null;
  login: (credential: string) => Promise<void>;
  logout: () => Promise<void>;
  clearLoginError: () => void;
  refreshEmployerSession: () => Promise<void>; // re-fetch /me → employerUser + company
}
