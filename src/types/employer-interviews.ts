// FILE: src/types/employer-interviews.ts
// Shapes for employer-side interview scheduling. Mirrors the backend's PUBLIC
// interview projection — bookingToken, calendarUid and companyId are never sent
// by the backend, so they deliberately do not exist on these types.

export type InterviewStatus = 'proposed' | 'scheduled' | 'cancelled' | 'completed' | 'no_show';

export type InterviewMode = 'video' | 'phone' | 'in_person';

/** One proposed time: UTC ISO start + duration. */
export interface InterviewSlot {
  startAtUtc: string;
  durationMinutes: number;
}

export interface Interview {
  id: string;
  /** 'pool' when the candidate picks from the posting's availability pool.
   *  Optional: the backend projection may not send it yet — pool interviews
   *  are also identifiable by an empty proposedSlots. */
  source?: 'pool' | 'manual' | null;
  applicationId: string | null;
  postingId: string | null;
  contactId: string | null;
  status: InterviewStatus;
  proposedSlots: InterviewSlot[];
  selectedSlotIndex: number | null;
  startAtUtc: string | null;
  timezoneId: string;
  durationMinutes: number;
  mode: InterviewMode;
  meetingUrl: string | null;
  locationText: string | null;
  calendarSequence: number;
  interviewerEmployerUserIds: string[];
  createdByEmployerUserId: string | null;
  bookingTokenExpiresAt: string;
  bookedAt: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  createdAt: string;
}

/** Posting-level interview configuration for pool scheduling. */
export interface InterviewDefaults {
  meetingUrl: string | null;
  durationMinutes: number;
  mode: InterviewMode;
  locationText: string | null;
  timezoneId: string;
}

export type InterviewTimeStatus = 'available' | 'booked' | 'cancelled' | 'past';

/** One bookable pool time (employer view — snapshots included). */
export interface InterviewTime {
  id: string;
  startAtUtc: string;
  durationMinutes: number;
  timezoneId: string;
  status: InterviewTimeStatus;
  mode: InterviewMode;
  meetingUrl: string | null;
  locationText: string | null;
  bookedByApplicationId: string | null;
  bookedAt: string | null;
}

export interface InterviewTimeCount {
  availableCount: number;
}

export interface ProposeInterviewInput {
  proposedSlots: InterviewSlot[];
  durationMinutes: number;
  mode: InterviewMode;
  meetingUrl: string | null;
  locationText: string | null;
  interviewerEmployerUserIds: string[];
  timezoneId: string;
}
