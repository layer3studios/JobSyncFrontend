'use client';
// FILE: src/components/seeker/JobDetailPanel/JobDetailStandalone.tsx
// Client wrapper that mounts the shared JobDetailPanel on the standalone
// /jobs/[jobId] SEO route. Wires applied state + comeback from seeker context/hook
// (D_impl_10); selecting a "similar role" navigates to its own detail route.
import { useRouter } from 'next/navigation';
import type { IJob } from '../../../types';
import { useSeeker } from '../../../context/seeker/SeekerContext';
import { useComeBack } from '../../../hooks/seeker/useComeBack';
import JobDetailPanel from './index';

export default function JobDetailStandalone({ job }: { job: IJob }) {
  const router = useRouter();
  const { currentUser, appliedJobIds, toggleApplied } = useSeeker();
  const { comeBackMap, toggle, remove } = useComeBack(currentUser);

  return (
    <div style={{
      border: '1px solid var(--border)', borderRadius: 14,
      overflow: 'hidden', background: 'var(--surface)', minHeight: 480,
    }}>
      <JobDetailPanel
        job={job}
        appliedJobIds={appliedJobIds}
        comeBackMap={comeBackMap}
        onToggleApplied={toggleApplied}
        onToggleComeBack={toggle}
        onRemoveComeBack={remove}
        onSelectJob={(j) => router.push(`/jobs/${j._id}`)}
      />
    </div>
  );
}
