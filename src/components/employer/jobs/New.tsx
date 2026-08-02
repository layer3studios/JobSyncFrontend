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

  // Returns the posting instead of navigating: PostingForm may still have an
  // assignment to attach as a second request, and routing away here would unmount
  // the form mid-flight and strand it. Navigation moves to onSubmitted, which only
  // fires once the whole save — posting AND attachment — has succeeded.
  const handleCreate = async (input: PostingCreateInput) => {
    const posting = await createEmployerPosting(input);
    trackEvent('posting_created', {
      postingId: posting.id,
      isDraft: posting.status === 'draft',
      isPublished: posting.status === 'active',
    });
    showToast('success', `Posting created: ${posting.title}`);
    return posting;
  };

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--surface-sunken)', padding: '48px 0' }}>
      <Container size="md">
        <PageHeader label="EMPLOYER" title="New posting" />
        <Card variant="raised">
          {/* No postingId and no applicationCount: on create there is no posting to
              attach to yet, so the assignment section knows it is the create surface
              and never asks for a confirm. */}
          <PostingForm
            submitLabel="Create posting"
            onSubmit={handleCreate}
            onSubmitted={(result) => {
              if (result && 'id' in result) router.push(`/employer/jobs/${result.id}`);
            }}
            onCancel={() => router.push('/employer/jobs')}
          />
        </Card>
      </Container>
    </div>
  );
}
