// FILE: settings/page.tsx
// Settings index (Server Component). New in Chunk 8a: settings had exactly one
// subpage (team) until now, so the nav linked straight at it and no index existed.
// A second subpage needs somewhere to be discovered from.
//
// Deliberately does no data fetching. Every card here links to a page that gates
// its own actions by role, so an index that pre-resolved the roster just to decide
// what to show would add a request and duplicate that logic. Read access to both
// subpages is open to every company role; the actions inside are not.
import type { Metadata } from 'next';
import Link from 'next/link';
import { Users, ClipboardList } from 'lucide-react';
import { PageHeader } from '@/components/ui/feedback';
import { Card } from '@/components/ui/Card';
import { EMPLOYER_ROUTES } from '@/components/layouts/parts/routes';

export function generateMetadata(): Metadata {
  return { title: 'Settings | JobMesh Employer', robots: { index: false } };
}

const SECTIONS = [
  {
    href: EMPLOYER_ROUTES.SETTINGS_TEAM,
    icon: Users,
    title: 'Team',
    description: 'Manage who has access to your company and what they can do.',
  },
  {
    href: EMPLOYER_ROUTES.SETTINGS_ASSIGNMENTS,
    icon: ClipboardList,
    title: 'Assignments',
    description: 'Reusable take-home tasks you can attach to postings.',
  },
];

export default function SettingsIndexPage() {
  return (
    <div className="container-xl" style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 28 }}>
      <PageHeader label="Settings" title="Settings" subtitle="Company-wide configuration." />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
        {SECTIONS.map(({ href, icon: Icon, title, description }) => (
          <Link key={href} href={href} style={{ textDecoration: 'none' }}>
            <Card>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <span style={{ color: 'var(--accent)', display: 'flex', flexShrink: 0, marginTop: 2 }}>
                  <Icon size={20} />
                </span>
                <div style={{ minWidth: 0 }}>
                  <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--ink)', margin: '0 0 4px' }}>{title}</h2>
                  <p style={{ fontSize: '0.85rem', color: 'var(--ink-muted)', margin: 0, lineHeight: 1.5 }}>
                    {description}
                  </p>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
