import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import JobsList from '@/components/employer/jobs/JobsList';

let viewer: { viewerRole: string | null };
vi.mock('@/context/employer/EmployerContext', () => ({ useEmployer: () => viewer }));
vi.mock('next/link', () => ({ default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a> }));

vi.mock('@/api/employer-jobs-api', async (importActual) => {
  const actual = await importActual<typeof import('@/api/employer-jobs-api')>();
  return { ...actual, listEmployerPostings: vi.fn(async () => ([])) };
});

describe('JobsList create-posting gating', () => {
  beforeEach(() => cleanup());

  it('hides "New posting" for an Interviewer', async () => {
    viewer = { viewerRole: 'interviewer' };
    render(<JobsList />);
    await waitFor(() => expect(screen.getByText('No postings yet')).toBeTruthy());
    expect(screen.queryByText('+ New posting')).toBeNull();
    expect(screen.queryByText('Create your first posting')).toBeNull();
  });

  it('shows "New posting" for a Member', async () => {
    viewer = { viewerRole: 'member' };
    render(<JobsList />);
    await waitFor(() => expect(screen.getByText('No postings yet')).toBeTruthy());
    expect(screen.getByText('+ New posting')).toBeTruthy();
  });
});
