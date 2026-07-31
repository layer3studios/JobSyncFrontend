// FILE: src/app/(apply)/interview/[bookingToken] — public candidate booking page.
// Server component: fetches booking data before render (no client refetch on
// mount) and branches to the right state. The path matches the backend's email
// link `${FRONTEND_URL}/interview/${bookingToken}`.
//
// PRIVACY: the token in this URL is a live credential. The page is noindexed
// here AND /interview/ is disallowed in robots.ts — robots.txt alone stops
// crawling but not indexing of an externally-linked URL; the meta tag is what
// actually prevents listing. This route must never enter sitemap.ts.
import type { Metadata } from 'next';
import { publicServerFetch } from '@/lib/public-server-fetch';
import { ServerFetchError } from '@/lib/server-fetch';
import type { CandidateBookingPage } from '@/types/public-interview';
import InterviewBookingClient from '@/components/interview/InterviewBookingClient';
import InterviewPageTracker from '@/components/interview/InterviewPageTracker';
import { ExpiredState, InvalidState } from '@/components/interview/InterviewBookingStates';

// Booking state must always be fresh — never serve a cached picker after booking.
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Interview booking',
  robots: { index: false, follow: false },
};

type LoadResult =
  | { kind: 'ok'; page: CandidateBookingPage }
  | { kind: 'expired' }
  | { kind: 'invalid' };

async function loadBookingPage(bookingToken: string): Promise<LoadResult> {
  try {
    const body = await publicServerFetch<{ data: CandidateBookingPage }>(
      `/public/interviews/${encodeURIComponent(bookingToken)}`, 0,
    );
    return { kind: 'ok', page: body.data };
  } catch (error) {
    if (error instanceof ServerFetchError && error.status === 410) return { kind: 'expired' };
    if (error instanceof ServerFetchError && error.status === 404) return { kind: 'invalid' };
    throw error;
  }
}

const CONTAINER_STYLE = { maxWidth: 560, width: '100%', margin: '0 auto', padding: '32px 16px' };

export default async function InterviewBookingPage(
  { params }: { params: Promise<{ bookingToken: string }> },
) {
  const { bookingToken } = await params;
  const result = await loadBookingPage(bookingToken);

  if (result.kind === 'expired') {
    return (
      <div style={CONTAINER_STYLE}>
        <InterviewPageTracker status="expired" />
        <ExpiredState companyName={null} />
      </div>
    );
  }
  if (result.kind === 'invalid') {
    return (
      <div style={CONTAINER_STYLE}>
        <InterviewPageTracker status="invalid" />
        <InvalidState />
      </div>
    );
  }

  const { page } = result;
  return (
    <div style={CONTAINER_STYLE}>
      <InterviewPageTracker status={page.status} mode={page.mode} />
      <InterviewBookingClient bookingToken={bookingToken} initial={page} />
    </div>
  );
}
