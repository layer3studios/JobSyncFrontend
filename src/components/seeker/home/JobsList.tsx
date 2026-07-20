// FILE: src/components/seeker/home/JobsList.tsx
import Link from 'next/link';
import { ArrowRight, Briefcase } from 'lucide-react';
import { Container, Button } from '../../ui';
import { COPY } from '../../../theme/brand';
import type { IJob } from '../../../types';
import JobCard from '../JobCard';
import { sectionLabel, sectionTitle, linkStyle } from './shared';

interface Props { jobs: IJob[]; loading: boolean; }

export default function JobsList({ jobs, loading }: Props) {
  return (
    <section style={{ padding: '40px 0 64px', borderTop: '1px solid var(--border)' }}>
      <Container size="lg">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
          <div>
            <p style={sectionLabel}>{COPY.home.jobsSectionLabel}</p>
            <h2 className="font-display" style={sectionTitle}>{COPY.home.jobsSectionTitle}</h2>
          </div>
          <Link href="/jobs" style={linkStyle}>{COPY.home.viewAll} <ArrowRight size={13} /></Link>
        </div>

        <div className="stagger" style={{ display: 'grid', gap: 10 }}>
          {loading ? (
            Array(6).fill(0).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 84, borderRadius: 12 }} />
            ))
          ) : jobs.map(j => <JobCard key={j._id} job={j} />)}
        </div>

        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <Button as="a" href="/jobs" variant="ghost" size="md">
            <Briefcase size={14} /> {COPY.home.loadMore}
          </Button>
        </div>
      </Container>
    </section>
  );
}
