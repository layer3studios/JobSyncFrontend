'use client';
// FILE: src/components/employer/Dashboard.tsx
// Company-aware employer dashboard. Shows the onboarded company's name, plan,
// slug and public apply URL (the URL goes live in Step 5). The onboarded guard
// guarantees a company here; the null branch is purely defensive.

import Link from 'next/link';
import { Container, Card, Button, Badge, Alert, PageHeader, Stack, useToast } from '@/components/ui';
import { useEmployer } from '@/context/employer/EmployerContext';

const CODE_STYLE = { fontSize: '0.875rem', color: 'var(--ink)' } as const;

export default function EmployerDashboard() {
  const { company, logout, refreshEmployerSession } = useEmployer();
  const { showToast } = useToast();

  if (!company) {
    return (
      <div style={{ minHeight: '100dvh', background: 'var(--surface-sunken)', padding: '48px 0' }}>
        <Container size="md">
          <Alert type="warning">
            <Stack gap={8} dir="row" align="center" justify="space-between">
              <span>Loading company…</span>
              <Button variant="ghost" size="sm" onClick={() => void refreshEmployerSession()}>Retry</Button>
            </Stack>
          </Alert>
        </Container>
      </div>
    );
  }

  const applyUrl = `${window.location.origin}/apply/${company.slug}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(applyUrl);
    showToast('success', 'Apply URL copied to clipboard.');
  };

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--surface-sunken)', padding: '48px 0' }}>
      <Container size="md">
        <PageHeader label="EMPLOYER" title={company.name} />
        <Card variant="raised">
          <Stack gap={16}>
            <Stack gap={8} dir="row" align="center">
              <Badge variant="brand">{company.plan}</Badge>
              <code style={CODE_STYLE}>{company.slug}</code>
            </Stack>

            <div>
              <p style={{ fontSize: '0.875rem', color: 'var(--ink-muted)', marginBottom: 6 }}>
                Your public apply URL
              </p>
              <Stack gap={8} dir="row" align="center" wrap>
                <code style={CODE_STYLE}>{applyUrl}</code>
                <Button variant="ghost" size="sm" onClick={handleCopy}>Copy</Button>
              </Stack>
            </div>

            <div>
              <Button variant="ghost" onClick={logout}>Sign out</Button>
            </div>
          </Stack>
        </Card>

        <Card variant="raised" style={{ marginTop: 16 }}>
          <Stack gap={12}>
            <div>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--ink)' }}>Postings</h2>
              <p style={{ fontSize: '0.875rem', color: 'var(--ink-muted)', marginTop: 4, lineHeight: 1.55 }}>
                Create job postings and share the apply URL with candidates.
              </p>
            </div>
            <Stack gap={8} dir="row" wrap>
              <Link href="/employer/jobs"><Button variant="secondary">View postings</Button></Link>
              <Link href="/employer/jobs/new"><Button variant="primary">+ New posting</Button></Link>
            </Stack>
          </Stack>
        </Card>
      </Container>
    </div>
  );
}
