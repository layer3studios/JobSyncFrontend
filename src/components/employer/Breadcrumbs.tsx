'use client';
// FILE: src/components/employer/Breadcrumbs.tsx
// Navigation path shown above page titles (replaces the old "EMPLOYER" label).
// Every item but the last links to its level; the last is the current page.

import Link from 'next/link';

export interface BreadcrumbItem { label: string; href?: string }

export default function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  if (items.length === 0) return null;
  return (
    <nav aria-label="Breadcrumb" style={{ marginBottom: 6 }}>
      <ol style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap', listStyle: 'none', margin: 0, padding: 0, fontSize: 13 }}>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {index > 0 && <span aria-hidden style={{ color: 'var(--ink-faint)' }}>/</span>}
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="breadcrumb-link"
                  style={{ color: 'var(--ink-2)', textDecoration: 'none' }}
                  onMouseEnter={(e) => { e.currentTarget.style.textDecoration = 'underline'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.textDecoration = 'none'; }}
                >
                  {item.label}
                </Link>
              ) : (
                <span aria-current={isLast ? 'page' : undefined} style={{ color: isLast ? 'var(--ink)' : 'var(--ink-2)' }}>
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
