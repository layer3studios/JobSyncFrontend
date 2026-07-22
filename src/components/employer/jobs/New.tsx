'use client';
// FILE: src/components/employer/jobs/New.tsx
// Create-posting page. Wraps PostingForm with the create submit handler. On
// success it toasts the new posting's title and returns to the list (4B.1),
// which refetches on mount so the new posting appears. Errors are surfaced by
// PostingForm itself — this handler intentionally lets them throw.

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Card, PageHeader, useToast } from '@/components/ui';
import PostingForm from '@/components/employer/jobs/PostingForm';
import { createEmployerPosting } from '@/api/employer-jobs-api';
import type { PostingCreateInput } from '@/types/employer-jobs';
import { trackEvent } from '@/lib/analytics-events';
import { getFromRoute } from '@/lib/from-route';

export default function EmployerJobsNew() {
  const router = useRouter();
  const { showToast } = useToast();

  // New-posting form opened.
  useEffect(() => { trackEvent('posting_form_opened', { fromRoute: getFromRoute() }); }, []);

  const handleCreate = async (input: PostingCreateInput) => {
    const posting = await createEmployerPosting(input);
    trackEvent('posting_created', {
      postingId: posting.id,
      isDraft: posting.status === 'draft',
      isPublished: posting.status === 'active',
    });
    showToast('success', `Posting created: ${posting.title}`);
    router.push(`/employer/jobs/${posting.id}`);
  };

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--surface-sunken)', padding: '48px 0' }}>
      <Container size="md">
        <PageHeader label="EMPLOYER" title="New posting" />
        <Card variant="raised">
          <PostingForm
            submitLabel="Create posting"
            onSubmit={handleCreate}
            onCancel={() => router.push('/employer/jobs')}
          />
        </Card>
      </Container>
    </div>
  );
}
