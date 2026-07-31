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

export interface ProposeInterviewInput {
  proposedSlots: InterviewSlot[];
  durationMinutes: number;
  mode: InterviewMode;
  meetingUrl: string | null;
  locationText: string | null;
  interviewerEmployerUserIds: string[];
  timezoneId: string;
}
