// FILE: tests/pages/employer/settings/team/settings-sidebar.test.tsx
// SettingsSidebar: Team is the only live link (active on /settings/team);
// Company / Roles / Email / Branding / Danger zone render inert.
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import SettingsSidebar from '@/app/(employer)/employer/(app)/(onboarded)/settings/SettingsSidebar';

vi.mock('next/navigation', () => ({ usePathname: () => '/employer/settings/team' }));

describe('SettingsSidebar', () => {
  it('renders Team as the active nav link', () => {
    render(<SettingsSidebar />);
    const team = screen.getByRole('link', { name: 'Team' });
    expect(team.getAttribute('href')).toBe('/employer/settings/team');
    expect(team.getAttribute('aria-current')).toBe('page');
  });

  it('renders disabled items as non-clickable (no links)', () => {
    render(<SettingsSidebar />);
    for (const label of ['Company', 'Roles', 'Email', 'Branding', 'Danger zone']) {
      const item = screen.getByText(label);
      expect(item.closest('a')).toBeNull();
      expect(item.getAttribute('aria-disabled')).toBe('true');
    }
    expect(screen.getAllByRole('link')).toHaveLength(1);
  });

  it('renders the horizontal variant with the same items', () => {
    render(<SettingsSidebar horizontal />);
    expect(screen.getByRole('link', { name: 'Team' })).toBeTruthy();
    expect(screen.getByText('Company').closest('a')).toBeNull();
  });
});
