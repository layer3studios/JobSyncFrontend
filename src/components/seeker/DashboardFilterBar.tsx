'use client';
// FILE: src/components/seeker/DashboardFilterBar.tsx
import type { CSSProperties } from 'react';

interface Option { value: string; label: string; }

interface Props {
  roleCategoryFilter: string;
  experienceBandFilter: string;
  workplaceFilter: string;
  dateFilter: string;
  sel: string;
  cos: string;
  roleOptions: Option[];
  experienceOptions: Option[];
  desktopSelectStyle: CSSProperties;
  setRoleCategoryFilter: (v: string) => void;
  setExperienceBandFilter: (v: string) => void;
  setWorkplaceFilter: (v: string) => void;
  setDateFilter: (v: string) => void;
  setSel: (v: string) => void;
  setCos: (v: string) => void;
  setSp: (fn: (sp: URLSearchParams) => void) => void;
}

export default function DashboardFilterBar({
  roleCategoryFilter, experienceBandFilter, workplaceFilter, dateFilter,
  sel, cos, roleOptions, experienceOptions, desktopSelectStyle,
  setRoleCategoryFilter, setExperienceBandFilter, setWorkplaceFilter,
  setDateFilter, setSel, setCos, setSp,
}: Props) {
  void sel; void cos; void setSel; void setCos;

  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <select
        value={roleCategoryFilter}
        onChange={e => { setRoleCategoryFilter(e.target.value); setSp(sp => { sp.set('role', e.target.value); sp.delete('page'); }); }}
        style={desktopSelectStyle}
      >
        {roleOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>

      <select
        value={experienceBandFilter}
        onChange={e => { setExperienceBandFilter(e.target.value); setSp(sp => { sp.set('exp', e.target.value); sp.delete('page'); }); }}
        style={desktopSelectStyle}
      >
        {experienceOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>

      <select
        value={workplaceFilter}
        onChange={e => { setWorkplaceFilter(e.target.value); setSp(sp => { sp.set('wp', e.target.value); sp.delete('page'); }); }}
        style={desktopSelectStyle}
      >
        <option value="all">All workplaces</option>
        <option value="remote">Remote</option>
        <option value="hybrid">Hybrid</option>
        <option value="on-site">On-site</option>
      </select>

      <select
        value={dateFilter}
        onChange={e => { setDateFilter(e.target.value); setSp(sp => { sp.set('date', e.target.value); sp.delete('page'); }); }}
        style={desktopSelectStyle}
      >
        <option value="all">Any time</option>
        <option value="today">Today</option>
        <option value="3d">Last 3 days</option>
        <option value="7d">Last week</option>
        <option value="30d">Last month</option>
      </select>
    </div>
  );
}
