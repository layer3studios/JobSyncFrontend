import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';

vi.mock('recharts', () => {
  const Pass = ({ children }: { children?: ReactNode }) => <div>{children}</div>;
  const Nil = () => null;
  return {
    ResponsiveContainer: Pass, LineChart: Pass, Line: Nil, Tooltip: Nil, XAxis: Nil, YAxis: Nil,
    BarChart: Pass, Bar: Pass, Cell: Nil, PieChart: Pass, Pie: Pass, Legend: Nil,
  };
});

import KpiTile from '@/app/(admin)/admin/analytics/parts/KpiTile';
import SparklineCard from '@/app/(admin)/admin/analytics/parts/SparklineCard';
import FunnelBarChart from '@/app/(admin)/admin/analytics/parts/FunnelBarChart';
import PieDistribution from '@/app/(admin)/admin/analytics/parts/PieDistribution';

describe('analytics parts (smoke)', () => {
  it('KpiTile renders label, formatted value, and hint', () => {
    render(<KpiTile label="Visitors" value={1234} hint="last 7 days" />);
    expect(screen.getByText('Visitors')).toBeTruthy();
    expect(screen.getByText('1,234')).toBeTruthy();
    expect(screen.getByText('last 7 days')).toBeTruthy();
  });

  it('SparklineCard renders its title and total', () => {
    render(<SparklineCard title="Visitors / day" data={[{ date: 'a', count: 2 }, { date: 'b', count: 3 }]} />);
    expect(screen.getByText('Visitors / day')).toBeTruthy();
    expect(screen.getByText('5')).toBeTruthy();
  });

  it('FunnelBarChart renders its title without throwing', () => {
    render(<FunnelBarChart title="Seeker conversion" stages={[{ stage: 'apply_started', count: 3 }]} />);
    expect(screen.getByText('Seeker conversion')).toBeTruthy();
  });

  it('PieDistribution renders its title; empty data shows a no-data note', () => {
    const { rerender } = render(<PieDistribution title="By referrer" data={[{ name: 'google', value: 5 }]} />);
    expect(screen.getByText('By referrer')).toBeTruthy();
    rerender(<PieDistribution title="By device" data={[]} />);
    expect(screen.getByText('No data')).toBeTruthy();
  });
});
