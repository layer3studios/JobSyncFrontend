// FILE: src/types/public-apply.ts
// Public apply-flow types — mirror the backend 5A public shapes
// (public-apply-routes.js). Public audience: unauthenticated candidates.

export interface PublicCompany {
  name: string;
  slug: string;
  website: string | null;
  logoUrl: string | null;
}

export interface PublicJob {
  id: string;
  slug: string;
  title: string;
  description: string;
  location: string;
  workplaceType: string;
  employmentType: string;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string;
  postedAt: string | null;
}

export interface PublicJobSummary {
  id: string;
  slug: string;
  title: string;
  location: string;
  employmentType: string;
}

export interface ApplyFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  coverNote: string;
  consent_dpdp: boolean;
  consent_futureOpportunities: boolean;
  resume: File | null;
  /** Honeypot — bots fill this hidden field; real users leave it empty (R4). */
  honeypot: string;
}
