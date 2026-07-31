// FILE: src/types/public-interview.ts
// The candidate-facing booking payload. Mirrors GET /api/public/interviews/:token
// exactly — it deliberately carries no company id, application id, contact id,
// booking token or meeting link, so the types must not claim they exist.

export type PublicInterviewStatus = 'proposed' | 'scheduled' | 'cancelled' | 'completed' | 'no_show';

export type PublicInterviewMode = 'video' | 'phone' | 'in_person';

export interface PublicInterviewSlot {
  startAtUtc: string;
  durationMinutes: number;
}

/** GET payload for the booking page. */
export interface CandidateBookingPage {
  id: string;
  status: PublicInterviewStatus;
  proposedSlots: PublicInterviewSlot[];
  selectedSlotIndex: number | null;
  startAtUtc: string | null;
  timezoneId: string;
  durationMinutes: number;
  mode: PublicInterviewMode;
  /** Present for in_person only — shown BEFORE slot choice so travel can be judged. */
  locationText: string | null;
  companyName: string | null;
  postingTitle: string | null;
  companyLogoUrl: string | null;
}

/** POST /book response — the candidate projection without the page extras. */
export type CandidateBookedInterview = Omit<CandidateBookingPage, 'companyName' | 'postingTitle' | 'companyLogoUrl'>;
