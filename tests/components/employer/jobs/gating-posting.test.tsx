import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { ToastProvider } from '@/components/ui';
import DetailSettings from '@/components/employer/jobs/DetailSettings';
import type { Posting } from '@/types/employer-jobs';

let viewer: { company: { slug: string } | null; viewerRole: string | null };
vi.mock('@/context/employer/EmployerContext', () => ({ useEmployer: () => viewer }));

const posting = {
  id: 'p1', slug: 'eng', title: 'Engineer', description: 'Build things',
  status: 'active', location: 'Remote', workplaceType: 'remote', employmentType: 'full_time',
  salaryMin: null, salaryMax: null,
  createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), postedAt: new Date().toISOString(),
} as unknown as Posting;

function renderSettings() {
  return render(<ToastProvider><DetailSettings posting={posting} onReload={async () => {}} /></ToastProvider>);
}

describe('DetailSettings posting gating', () => {
  beforeEach(() => cleanup());

  it('hides Edit + Close posting for an Interviewer', () => {
    viewer = { company: { slug: 'acme' }, viewerRole: 'interviewer' };
    renderSettings();
    expect(screen.queryByText('Edit')).toBeNull();
    expect(screen.queryByText('Close posting')).toBeNull();
  });

  it('shows Edit + Close posting for a Member', () => {
    viewer = { company: { slug: 'acme' }, viewerRole: 'member' };
    renderSettings();
    expect(screen.getByText('Edit')).toBeTruthy();
    expect(screen.getByText('Close posting')).toBeTruthy();
  });
});
