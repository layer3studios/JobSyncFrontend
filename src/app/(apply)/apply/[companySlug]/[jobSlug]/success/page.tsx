// FILE: src/app/(apply)/apply/[companySlug]/[jobSlug]/success/page.tsx
// Post-submit confirmation — Server Component, noindex (robots.ts also disallows
// /apply/*/success). Reads the company + job from the success query params (passed
// by ApplyFormClient); falls back to a generic message on direct navigation (R5).
import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { Container, Card, Button, Stack } from '@/components/ui';

export const metadata: Metadata = {
  title: 'Application submitted',
  robots: { index: false, follow: false },
};

export default async function ApplySuccessPage({
  params, searchParams,
}: {
  params: Promise<{ companySlug: string; jobSlug: string }>;
  searchParams: Promise<{ company?: string; job?: string }>;
}) {
  const { companySlug } = await params;
  const { company: companyName, job: jobTitle } = await searchParams;

  return (
    <Container size="sm" style={{ paddingTop: 40, paddingBottom: 60 }}>
      <Card variant="raised">
        <Stack gap={14} align="center">
          <CheckCircle2 size={44} color="var(--success)" aria-hidden />
          <h1 className="font-display" style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--ink)', textAlign: 'center' }}>
            Application submitted
          </h1>
          <p style={{ fontSize: '0.95rem', color: 'var(--ink)', textAlign: 'center', lineHeight: 1.55 }}>
            {jobTitle && companyName
              ? `You applied to ${jobTitle} at ${companyName}.`
              : 'Your application has been submitted.'}
          </p>
          <p style={{ fontSize: '0.875rem', color: 'var(--ink-muted)', textAlign: 'center', lineHeight: 1.6 }}>
            What happens next: the team will review your application. You may hear back within a few days.
          </p>
          <Link href={`/apply/${companySlug}`}>
            <Button variant="secondary">
              {companyName ? `View more positions at ${companyName}` : 'View more positions'}
            </Button>
          </Link>
        </Stack>
      </Card>
    </Container>
  );
}
