'use client';
// FILE: src/components/apply/CompanyView.tsx
// Public mini careers page body (/apply/:companySlug). Lists a company's active
// jobs; each links to the apply form. No auth, no seeker/employer context (C9).
// Ported from the Vite Company.tsx — the server page now provides {company, jobs}.

import Link from 'next/link';
import { Container, Card, Stack, EmptyState } from '@/components/ui';
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
        <div>
          <h1 className="font-display" style={{ fontSize: 'clamp(1.6rem, 4vw, 2.1rem)', fontWeight: 600, color: 'var(--ink)' }}>{company.name}</h1>
          {company.website && (
            <a href={company.website} target="_blank" rel="noreferrer" style={{ fontSize: '0.9rem', color: 'var(--link)' }}>
              {company.website}
            </a>
          )}
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
                </Card>
              </Link>
            ))}
          </Stack>
        )}
      </Stack>
    </Container>
  );
}
