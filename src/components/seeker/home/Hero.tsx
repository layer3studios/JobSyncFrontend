// FILE: src/components/seeker/home/Hero.tsx
import { ArrowRight, Building2, Sparkles } from 'lucide-react';
import { Container, Button } from '../../ui';
import { COPY } from '../../../theme/brand';
import { Stat } from './shared';

export default function Hero() {
  return (
    <section style={{
      position: 'relative',
      padding: 'clamp(56px, 10vw, 100px) 0 clamp(40px, 8vw, 72px)',
      overflow: 'hidden',
    }}>
      <div className="grid-bg" style={{ position: 'absolute', inset: 0, opacity: 0.35, pointerEvents: 'none' }} />
      <div className="orb" style={{ width: 400, height: 400, top: -100, left: -100, background: 'var(--accent-soft)' }} />
      <div className="orb" style={{ width: 360, height: 360, top: -50, right: -120, background: 'var(--info-soft)' }} />

      <Container size="lg" style={{ position: 'relative' }}>
        <div className="anim-up" style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '5px 12px', borderRadius: 999,
          background: 'var(--accent-soft)', color: 'var(--accent)',
          fontSize: '0.78rem', fontWeight: 500, marginBottom: 18,
        }}>
          <Sparkles size={12} /> {COPY.home.heroLabel}
        </div>

        <h1 className="font-display anim-up" style={{
          fontSize: 'clamp(2.2rem, 7vw, 4rem)', fontWeight: 600,
          lineHeight: 1.05, letterSpacing: '-0.035em',
          color: 'var(--ink)', marginBottom: 14, maxWidth: 820,
        }}>
          {COPY.home.heroTitle1}{' '}
          <span style={{ color: 'var(--accent)' }}>{COPY.home.heroTitle2}</span>
        </h1>
        <p className="anim-up" style={{
          fontSize: 'clamp(1rem, 2vw, 1.15rem)',
          color: 'var(--ink-muted)', maxWidth: 640, lineHeight: 1.55, marginBottom: 28,
        }}>{COPY.home.heroSubtitle}</p>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Button as="a" href="/jobs" variant="primary" size="lg">
            {COPY.home.heroCTA} <ArrowRight size={16} />
          </Button>
          <Button as="a" href="/directory" variant="ghost" size="lg">
            <Building2 size={14} /> {COPY.home.heroSecondaryCTA}
          </Button>
        </div>

        <div style={{ display: 'flex', gap: 28, marginTop: 40, flexWrap: 'wrap' }}>
          <Stat value={COPY.home.stat1Value} label={COPY.home.stat1Label} />
          <Stat value={COPY.home.stat2Value} label={COPY.home.stat2Label} />
          <Stat value="Direct" label="Apply links" />
        </div>
      </Container>
    </section>
  );
}
