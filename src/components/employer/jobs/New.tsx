'use client';
// FILE: src/components/employer/jobs/New.tsx
// Create-posting page: the form on the left, a sticky live preview on the
// right (stacked on narrow screens). Submit/analytics behaviour unchanged —
// PostingForm still owns validation and errors.

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Card, PageHeader, useToast } from '@/components/ui';
import PostingForm from '@/components/employer/jobs/PostingForm';
import PostingLivePreview from '@/components/employer/jobs/PostingLivePreview';
import type { PostingFormValues } from '@/components/employer/jobs/posting-form-helpers';
import { createEmployerPosting } from '@/api/employer-jobs-api';
import type { PostingCreateInput } from '@/types/employer-jobs';
import { trackEvent } from '@/lib/analytics-events';
import { getFromRoute } from '@/lib/from-route';

const EMPTY_VALUES: PostingFormValues = {
  title: '', description: '', location: '', workplaceType: '', employmentType: '',
  salaryMinStr: '', salaryMaxStr: '',
};

export default function EmployerJobsNew() {
  const router = useRouter();
  const { showToast } = useToast();
  const [previewValues, setPreviewValues] = useState<PostingFormValues>(EMPTY_VALUES);

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
      <Container size="wide">
        <PageHeader label="EMPLOYER" title="New posting" />
        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div style={{ flex: '3 1 420px', minWidth: 340 }}>
            <Card variant="raised">
              <p style={{ margin: '0 0 14px', fontSize: 16, fontWeight: 500, color: 'var(--ink)' }}>New posting</p>
              <PostingForm
                submitLabel="Create posting"
                onSubmit={handleCreate}
                onCancel={() => router.push('/employer/jobs')}
                onValuesChange={setPreviewValues}
              />
            </Card>
          </div>
          <div style={{ flex: '2 1 300px', minWidth: 280 }}>
            <PostingLivePreview values={previewValues} />
          </div>
        </div>
      </Container>
    </div>
  );
}
