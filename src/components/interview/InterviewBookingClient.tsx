'use client';
// FILE: src/components/interview/InterviewBookingClient.tsx
// Client island for the bookable state. Receives server-fetched data — it never
// refetches on mount. Success swaps content in place (no navigation) inside a
// live region; a 409 refetches and re-renders whichever state now applies.

import { useState } from 'react';
import { Button } from '@/components/ui';
import { bookInterviewSlot, fetchBookingPage, PublicInterviewsApiError } from '@/api/public-interviews-api';
import type { CandidateBookingPage } from '@/types/public-interview';
import { trackEvent } from '@/lib/analytics-events';
import InterviewSlotPicker from './InterviewSlotPicker';
import {
  BookingPageHeader, ConfirmedState, ExpiredState, InvalidState, CancelledState, describeInterview,
} from './InterviewBookingStates';

const RATE_LIMIT_MESSAGE = 'Too many attempts — please wait a few minutes and try again.';
const NETWORK_MESSAGE = 'Something went wrong. Check your connection and try again.';
const SLOT_TOO_SOON_MESSAGE = 'That time is now too close to book. Please pick another option.';

type TerminalView = 'expired' | 'invalid' | null;

export default function InterviewBookingClient({
  bookingToken, initial,
}: {
  bookingToken: string;
  initial: CandidateBookingPage;
}) {
  const [page, setPage] = useState(initial);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [justBookedAtUtc, setJustBookedAtUtc] = useState<string | null>(null);
  const [terminal, setTerminal] = useState<TerminalView>(null);
  const [slotErrorIndex, setSlotErrorIndex] = useState<number | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);

  async function refetchAfterConflict(): Promise<void> {
    try {
      const fresh = await fetchBookingPage(bookingToken);
      setPage(fresh);
      setSelectedIndex(null);
    } catch (caught) {
      if (caught instanceof PublicInterviewsApiError && caught.status === 410) setTerminal('expired');
      else if (caught instanceof PublicInterviewsApiError && caught.status === 404) setTerminal('invalid');
      else setGlobalError(NETWORK_MESSAGE);
    }
  }

  async function handleConfirm(): Promise<void> {
    if (submitting || selectedIndex === null) return;
    setSubmitting(true); setSlotErrorIndex(null); setGlobalError(null);
    try {
      const booked = await bookInterviewSlot(bookingToken, selectedIndex);
      setJustBookedAtUtc(booked.startAtUtc);
      trackEvent('interview_slot_confirmed', { mode: page.mode, slotIndex: selectedIndex });
    } catch (caught) {
      if (caught instanceof PublicInterviewsApiError) {
        if (caught.status === 409) await refetchAfterConflict();
        else if (caught.status === 410) setTerminal('expired');
        else if (caught.status === 404) setTerminal('invalid');
        else if (caught.code === 'SLOT_TOO_SOON') setSlotErrorIndex(selectedIndex);
        else if (caught.status === 429) setGlobalError(RATE_LIMIT_MESSAGE);
        else setGlobalError(NETWORK_MESSAGE);
      } else {
        setGlobalError(NETWORK_MESSAGE);
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (terminal === 'expired') return <ExpiredState companyName={page.companyName} />;
  if (terminal === 'invalid') return <InvalidState />;

  const confirmedTime = justBookedAtUtc ?? page.startAtUtc;
  if (justBookedAtUtc !== null || page.status === 'scheduled') {
    return (
      <div aria-live="polite">
        <ConfirmedState
          startAtUtc={confirmedTime}
          mode={page.mode}
          durationMinutes={page.durationMinutes}
          locationText={page.locationText}
          isReminder={justBookedAtUtc === null}
        />
      </div>
    );
  }
  if (page.status === 'cancelled') return <CancelledState companyName={page.companyName} />;
  if (page.status !== 'proposed') return <InvalidState />;

  return (
    <div aria-live="polite" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <BookingPageHeader companyName={page.companyName} companyLogoUrl={page.companyLogoUrl} postingTitle={page.postingTitle} />
      <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--ink-2)' }}>{describeInterview(page.mode, page.durationMinutes)}</p>
      {page.mode === 'in_person' && page.locationText && (
        <p style={{ margin: 0, padding: '10px 14px', background: 'var(--surface-sunken)', borderRadius: 10, fontSize: '0.92rem', color: 'var(--ink)' }}>
          <strong>Location:</strong> {page.locationText}
        </p>
      )}

      <InterviewSlotPicker
        slots={page.proposedSlots}
        selectedIndex={selectedIndex}
        onSelect={(index) => { setSelectedIndex(index); setSlotErrorIndex(null); }}
        slotErrorIndex={slotErrorIndex}
        slotErrorMessage={slotErrorIndex !== null ? SLOT_TOO_SOON_MESSAGE : null}
      />

      {globalError && (
        <div role="alert" style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.88rem', color: 'var(--danger)' }}>
          <span>{globalError}</span>
          {globalError === NETWORK_MESSAGE && (
            <div><Button variant="secondary" size="sm" onClick={() => void handleConfirm()}>Try again</Button></div>
          )}
        </div>
      )}

      <div style={{ position: 'sticky', bottom: 0, padding: '12px 0', background: 'var(--paper)' }}>
        <Button
          style={{ width: '100%' }}
          loading={submitting}
          disabled={selectedIndex === null || submitting}
          aria-busy={submitting || undefined}
          onClick={() => void handleConfirm()}
        >
          Confirm this time
        </Button>
        <p style={{ margin: '10px 0 0', fontSize: '0.8rem', color: 'var(--ink-muted)', textAlign: 'center' }}>
          You&apos;ll receive a calendar invitation by email. This link expires if unused.
        </p>
      </div>
    </div>
  );
}
