'use client';
// FILE: settings/SettingsSidebar.tsx
// Shared settings navigation (all /employer/settings/* pages). Only Team is
// live; the future sections render muted + inert so founders can see what's
// coming. Below 768px the layout swaps this for horizontal tabs.

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Building2, Users, Shield, Mail, Palette, Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';

interface SettingsNavItem { label: string; href: string | null; icon: ReactNode; danger?: boolean }

export const SETTINGS_NAV_ITEMS: SettingsNavItem[] = [
  { label: 'Company', href: null, icon: <Building2 size={14} /> },
  { label: 'Team', href: '/employer/settings/team', icon: <Users size={14} /> },
  { label: 'Roles', href: null, icon: <Shield size={14} /> },
  { label: 'Email', href: null, icon: <Mail size={14} /> },
  { label: 'Branding', href: null, icon: <Palette size={14} /> },
];

const ITEM_STYLE = {
  display: 'flex', alignItems: 'center', gap: 8, fontSize: 13,
  padding: '7px 10px', borderRadius: 8, textDecoration: 'none',
} as const;

function NavItem({ item, active, horizontal }: { item: SettingsNavItem; active: boolean; horizontal?: boolean }) {
  const style = {
    ...ITEM_STYLE,
    ...(horizontal ? { flexShrink: 0 } : {}),
    background: active ? 'var(--accent-soft)' : 'transparent',
    color: active ? 'var(--ink)' : item.danger ? 'var(--danger)' : 'var(--ink-faint)',
    cursor: item.href ? 'pointer' : 'default',
    fontWeight: active ? 500 : 400,
  };
  const icon = <span style={{ color: active ? 'var(--accent)' : 'inherit', display: 'inline-flex' }}>{item.icon}</span>;
  if (!item.href) {
    return <span aria-disabled="true" style={style}>{icon}{item.label}</span>;
  }
  return <Link href={item.href} aria-current={active ? 'page' : undefined} style={style}>{icon}{item.label}</Link>;
}

export default function SettingsSidebar({ horizontal = false }: { horizontal?: boolean }) {
  const pathname = usePathname();
  const isActive = (href: string | null): boolean => href !== null && (pathname ?? '').startsWith(href);

  if (horizontal) {
    return (
      <nav aria-label="Settings" style={{ display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 8 }}>
        {SETTINGS_NAV_ITEMS.map((item) => (
          <NavItem key={item.label} item={item} active={isActive(item.href)} horizontal />
        ))}
      </nav>
    );
  }
  return (
    <nav aria-label="Settings" style={{ width: 200, flexShrink: 0, borderRight: '0.5px solid var(--border)', paddingRight: 12 }}>
      <p style={{ margin: '0 0 8px', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--ink-faint)' }}>
        Settings
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {SETTINGS_NAV_ITEMS.map((item) => (
          <NavItem key={item.label} item={item} active={isActive(item.href)} />
        ))}
      </div>
      <div style={{ borderTop: '0.5px solid var(--border)', margin: '12px 0' }} />
      <NavItem item={{ label: 'Danger zone', href: null, icon: <Trash2 size={14} />, danger: true }} active={false} />
    </nav>
  );
}
