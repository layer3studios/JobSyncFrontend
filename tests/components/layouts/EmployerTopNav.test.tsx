import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import EmployerTopNav from '@/components/layouts/parts/EmployerTopNav';
import type { Role } from '@/types/employer-team';

vi.mock('next/navigation', () => ({ usePathname: () => '/employer' }));
vi.mock('next/link', () => ({
  default: ({ children, href, ...rest }: { children: React.ReactNode; href: string }) =>
    <a href={href} {...rest}>{children}</a>,
}));

const user = { name: 'Ada', email: 'ada@x.io', picture: 'https://x/p.jpg' };

function renderNav(role: Role | null | undefined) {
  render(<EmployerTopNav isCompact={false} currentUser={user} companyName="Acme" role={role} onLogout={vi.fn()} />);
}

describe('EmployerTopNav Settings link', () => {
  it('is visible for Founder and Owner', () => {
    renderNav('founder');
    expect(screen.getByText('Settings')).toBeTruthy();
    renderNav('owner');
    expect(screen.getAllByText('Settings').length).toBeGreaterThan(0);
  });

  it('is hidden for Member and Interviewer', () => {
    renderNav('member');
    expect(screen.queryByText('Settings')).toBeNull();
    renderNav('interviewer');
    expect(screen.queryByText('Settings')).toBeNull();
  });

  it('is hidden when no role is known', () => {
    renderNav(null);
    expect(screen.queryByText('Settings')).toBeNull();
  });
});
