'use client';
// FILE: src/components/seeker/DashboardFilterSheet.tsx
import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '../ui';
import { Group, Chips } from './DashboardFilterSheetParts';

interface Option { value: string; label: string; }

interface Props {
  isOpen: boolean;
  onClose: () => void;
  activeFilterCount: number;
  visibleJobsCount: number;
  clearAllFilters: () => void;
  roleCategoryFilter: string;
  experienceBandFilter: string;
  workplaceFilter: string;
  dateFilter: string;
  roleOptions: Option[];
  experienceOptions: Option[];
  setRoleCategoryFilter: (v: string) => void;
  setExperienceBandFilter: (v: string) => void;
  setWorkplaceFilter: (v: string) => void;
  setDateFilter: (v: string) => void;
  setSp: (fn: (sp: URLSearchParams) => void) => void;
}

export default function DashboardFilterSheet({
  isOpen, onClose, activeFilterCount, visibleJobsCount, clearAllFilters,
  roleCategoryFilter, experienceBandFilter, workplaceFilter, dateFilter,
  roleOptions, experienceOptions,
  setRoleCategoryFilter, setExperienceBandFilter, setWorkplaceFilter,
  setDateFilter, setSp,
}: Props) {
  const [mounted, setMounted] = useState(isOpen);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (isOpen) { setMounted(true); setClosing(false); }
    else if (mounted) {
      setClosing(true);
      const t = setTimeout(() => setMounted(false), 220);
      return () => clearTimeout(t);
    }
  }, [isOpen, mounted]);

  if (!mounted) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(15,15,14,0.45)',
        animation: `${closing ? 'sheetFadeIn' : 'sheetFadeIn'} 0.22s ease ${closing ? 'reverse' : 'normal'}`,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          background: 'var(--surface)',
          borderTopLeftRadius: 18, borderTopRightRadius: 18,
          maxHeight: '85vh',
          display: 'flex', flexDirection: 'column',
          animation: `${closing ? 'sheetSlideDown' : 'sheetSlideUp'} 0.28s cubic-bezier(0.16, 1, 0.3, 1)`,
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {/* Drag handle */}
        <div style={{
          width: 36, height: 4, borderRadius: 999,
          background: 'var(--border-strong)',
          margin: '8px auto 0',
        }} />

        <div style={{
          padding: '14px 20px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          borderBottom: '1px solid var(--border)',
        }}>
          <h2 className="font-display" style={{ fontSize: '1.1rem', fontWeight: 600 }}>
            Filters {activeFilterCount > 0 && <span style={{ color: 'var(--ink-muted)', fontWeight: 500, fontSize: '0.85rem' }}>· {activeFilterCount}</span>}
          </h2>
          <button onClick={onClose} aria-label="Close" style={{
            width: 30, height: 30, borderRadius: 8,
            background: 'var(--paper-2)', border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--ink-muted)', cursor: 'pointer',
          }}>
            <X size={14} />
          </button>
        </div>

        <div className="thin-scroll" style={{ overflowY: 'auto', flex: 1, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Group label="Role">
            <Chips
              value={roleCategoryFilter}
              options={roleOptions}
              onChange={v => { setRoleCategoryFilter(v); setSp(sp => { sp.set('role', v); sp.delete('page'); }); }}
            />
          </Group>
          <Group label="Experience">
            <Chips
              value={experienceBandFilter}
              options={experienceOptions}
              onChange={v => { setExperienceBandFilter(v); setSp(sp => { sp.set('exp', v); sp.delete('page'); }); }}
            />
          </Group>
          <Group label="Workplace">
            <Chips
              value={workplaceFilter}
              options={[
                { value: 'all', label: 'All' },
                { value: 'remote', label: 'Remote' },
                { value: 'hybrid', label: 'Hybrid' },
                { value: 'on-site', label: 'On-site' },
              ]}
              onChange={v => { setWorkplaceFilter(v); setSp(sp => { sp.set('wp', v); sp.delete('page'); }); }}
            />
          </Group>
          <Group label="Posted">
            <Chips
              value={dateFilter}
              options={[
                { value: 'all', label: 'Any time' },
                { value: 'today', label: 'Today' },
                { value: '3d', label: '3 days' },
                { value: '7d', label: '1 week' },
                { value: '30d', label: '1 month' },
              ]}
              onChange={v => { setDateFilter(v); setSp(sp => { sp.set('date', v); sp.delete('page'); }); }}
            />
          </Group>
        </div>

        <div style={{
          padding: '12px 20px',
          borderTop: '1px solid var(--border)',
          background: 'var(--paper-2)',
          display: 'flex', gap: 8,
        }}>
          <Button variant="ghost" size="md" onClick={clearAllFilters} style={{ flex: 1 }}>Clear all</Button>
          <Button variant="primary" size="md" onClick={onClose} style={{ flex: 2 }}>
            Show {visibleJobsCount} results
          </Button>
        </div>
      </div>
    </div>
  );
}
