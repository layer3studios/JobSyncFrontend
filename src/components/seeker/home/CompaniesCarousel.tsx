'use client';
// FILE: src/components/seeker/home/CompaniesCarousel.tsx
import { useRef } from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { Container } from '../../ui';
import { COPY } from '../../../theme/brand';
import type { ICompany } from '../../../types';
import CompanyLogo from '../CompanyLogo';
import { sectionLabel, sectionTitle, linkStyle, scrollBtn } from './shared';

interface Props { companies: ICompany[]; loading: boolean; }

export default function CompaniesCarousel({ companies, loading }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: 'left' | 'right') => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir === 'left' ? -280 : 280, behavior: 'smooth' });
  };

  return (
    <section style={{ padding: '40px 0', borderTop: '1px solid var(--border)' }}>
      <Container size="lg">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
          <div>
            <p style={sectionLabel}>{COPY.home.companiesSectionLabel}</p>
            <h2 className="font-display" style={sectionTitle}>
              {COPY.home.companiesSectionTitle1} <span style={{ color: 'var(--accent)' }}>{COPY.home.companiesSectionTitle2}</span>
            </h2>
          </div>
          <Link href="/directory" style={linkStyle}>
            {COPY.home.fullDirectory} <ArrowRight size={13} />
          </Link>
        </div>

        <div style={{ position: 'relative' }}>
          <div className="snap-carousel" ref={ref} style={{ gap: 12 }}>
            {(loading ? Array(6).fill(0) : companies).map((c, i) => (
              loading ? (
                <div key={i} className="skeleton" style={{ minWidth: 200, height: 130, borderRadius: 12, flexShrink: 0 }} />
              ) : (
                <Link
                  key={c._id || c.companyName}
                  href="/directory"
                  style={{
                    display: 'flex', flexDirection: 'column', gap: 10,
                    minWidth: 200, maxWidth: 230, padding: 14,
                    background: 'var(--surface)', border: '1px solid var(--border)',
                    borderRadius: 12, textDecoration: 'none',
                    transition: 'all 180ms ease', flexShrink: 0,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  <CompanyLogo name={c.companyName} domain={c.domain} size={36} borderRadius={10} />
                  <div>
                    <p style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--ink)', letterSpacing: '-0.01em', lineHeight: 1.3 }}>{c.companyName}</p>
                    <p style={{ fontSize: '0.78rem', color: 'var(--ink-muted)', marginTop: 3 }}>
                      {c.openRoles} open role{c.openRoles === 1 ? '' : 's'}
                    </p>
                  </div>
                </Link>
              )
            ))}
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 12, justifyContent: 'flex-end' }}>
            <button onClick={() => scroll('left')} aria-label={COPY.home.scrollLeft} style={scrollBtn}><ChevronLeft size={14} /></button>
            <button onClick={() => scroll('right')} aria-label={COPY.home.scrollRight} style={scrollBtn}><ChevronRight size={14} /></button>
          </div>
        </div>
      </Container>
    </section>
  );
}
