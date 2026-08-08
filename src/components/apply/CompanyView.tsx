'use client';
// FILE: src/components/apply/CompanyView.tsx
// Public mini careers page body (/apply/:companySlug). Lists a company's active
// jobs; each links to the apply form. No auth, no seeker/employer context (C9).
// Ported from the Vite Company.tsx — the server page now provides {company, jobs}.

import Link from 'next/link';
import { Container, Card, Stack, EmptyState } from '@/components/ui';
import AssignmentBadge from './AssignmentBadge';
import CompanyLogoMark from '@/components/company/CompanyLogoMark';
import type { PublicCompany, PublicJobSummary } from '@/types/public-apply';

interface Props {
  company: PublicCompany;
  jobs: PublicJobSummary[];
}

export default function CompanyView({ company, jobs }: Props) {
  const companySlug = company.slug;

  return (
    <Container size="md" style={{ paddingTop: 32, paddingBottom: 60 }}>
      <Stack gap={20}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <CompanyLogoMark name={company.name} logoUrl={company.logoUrl} size={48} borderRadius={12} />
          <div style={{ minWidth: 0 }}>
            <h1 className="font-display" style={{ fontSize: 'clamp(1.6rem, 4vw, 2.1rem)', fontWeight: 600, color: 'var(--ink)' }}>{company.name}</h1>
            {company.tagline && (
              <p style={{ margin: '2px 0 0', fontSize: 14, color: 'var(--ink-muted)' }}>{company.tagline}</p>
            )}
            {company.website && (
              <a href={company.website} target="_blank" rel="noreferrer" style={{ fontSize: '0.9rem', color: 'var(--link)' }}>
                {company.website}
              </a>
            )}
          </div>
        </div>

        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--ink)' }}>Open positions</h2>

        {jobs.length === 0 ? (
          <EmptyState title="No open positions" description="This company has no open positions at this time." />
        ) : (
          <Stack gap={10}>
            {jobs.map((job) => (
              <Link key={job.id} href={`/apply/${companySlug}/${job.slug}`} style={{ textDecoration: 'none' }}>
                <Card hoverable>
                  <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--ink)' }}>{job.title}</p>
                  <p style={{ fontSize: '0.85rem', color: 'var(--ink-muted)', marginTop: 2 }}>
                    {[job.location, job.employmentType].filter(Boolean).join(' · ')}
                  </p>
                  {/* The cost has to be visible BEFORE the click. Finding out a
                      role wants two hours of unpaid work halfway through the form
                      is the worst possible moment to learn it. */}
                  {job.assignment && (
                    <div style={{ marginTop: 6 }}>
                      <AssignmentBadge estimatedHours={job.assignment.estimatedHours} size="sm" />
                    </div>
                  )}
                </Card>
              </Link>
            ))}
          </Stack>
        )}
      </Stack>
    </Container>
  );
}
