// FILE: tests/app/interview/booking-page.test.tsx
// Server-page branching + the privacy guarantees: noindex metadata and no
// booking token anywhere in the rendered HTML.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import InterviewBookingPage, { metadata } from '@/app/(apply)/interview/[bookingToken]/page';
import { ServerFetchError } from '@/lib/server-fetch';
import type { CandidateBookingPage } from '@/types/public-interview';

const publicServerFetch = vi.fn();
vi.mock('@/lib/public-server-fetch', () => ({
  publicServerFetch: (...args: unknown[]) => publicServerFetch(...args),
}));

const TOKEN = 'secret-booking-token-abc123xyz';

function bookablePage(overrides: Partial<CandidateBookingPage> = {}): CandidateBookingPage {
  return {
    id: 'i1', status: 'proposed',
    proposedSlots: [
      { startAtUtc: '2030-08-10T09:30:00.000Z', durationMinutes: 45 },
      { startAtUtc: '2030-08-11T09:30:00.000Z', durationMinutes: 45 },
    ],
    selectedSlotIndex: null, startAtUtc: null, timezoneId: 'Asia/Kolkata',
    durationMinutes: 45, mode: 'video', locationText: null,
    companyName: 'Acme', postingTitle: 'Backend Engineer', companyLogoUrl: null,
    ...overrides,
  };
}

async function renderPage() {
  const element = await InterviewBookingPage({ params: Promise.resolve({ bookingToken: TOKEN }) });
  return render(element);
}

beforeEach(() => { publicServerFetch.mockReset(); cleanup(); });

describe('interview booking page (server)', () => {
  it('metadata exports robots index false and follow false', () => {
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });

  it('a bookable payload renders one option per proposed slot', async () => {
    publicServerFetch.mockResolvedValue({ data: bookablePage() });
    await renderPage();
    expect(screen.getAllByRole('radio')).toHaveLength(2);
    expect(screen.getByText('Backend Engineer')).toBeTruthy();
  });

  it('a 410 renders the expired state', async () => {
    publicServerFetch.mockRejectedValue(new ServerFetchError(410, null, 'gone'));
    await renderPage();
    expect(screen.getByText('This booking link has expired')).toBeTruthy();
  });

  it('a 404 renders the invalid state — identical wording for any dead token', async () => {
    publicServerFetch.mockRejectedValue(new ServerFetchError(404, null, 'nope'));
    const { container } = await renderPage();
    expect(screen.getByText("This interview link isn't valid")).toBeTruthy();
    expect(container.innerHTML).not.toContain(TOKEN);
  });

  it('status scheduled on load renders the already-confirmed state, not the picker', async () => {
    publicServerFetch.mockResolvedValue({
      data: bookablePage({ status: 'scheduled', startAtUtc: '2030-08-10T09:30:00.000Z', selectedSlotIndex: 0 }),
    });
    await renderPage();
    expect(screen.getByText(/Your interview is already confirmed/)).toBeTruthy();
    expect(screen.queryAllByRole('radio')).toHaveLength(0);
  });

  it('status cancelled renders the cancelled state', async () => {
    publicServerFetch.mockResolvedValue({ data: bookablePage({ status: 'cancelled' }) });
    await renderPage();
    expect(screen.getByText('This interview was cancelled')).toBeTruthy();
  });

  it('the rendered HTML contains no booking token anywhere', async () => {
    publicServerFetch.mockResolvedValue({ data: bookablePage() });
    const { container } = await renderPage();
    expect(container.innerHTML).not.toContain(TOKEN);
  });
});
