'use client';
import { Bell, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import ThemeToggle from '../ui/ThemeToggle';

interface HeaderProps {
  title?: string;
  breadcrumbs?: { label: string; href?: string }[];
  actions?: React.ReactNode;
}

export default function Header({ breadcrumbs, actions }: HeaderProps) {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between px-6 py-3.5"
      style={{
        background: 'rgba(var(--surface-1-rgb, 15,15,24), 0.85)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border)',
        minHeight: '60px',
        backgroundColor: 'var(--surface-1)',
      }}>
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2">
        {breadcrumbs?.map((crumb, i) => (
          <span key={i} className="flex items-center gap-2">
            {i > 0 && <ChevronRight size={13} style={{ color: 'var(--ink-faint)' }} />}
            {crumb.href ? (
              <Link href={crumb.href} className="text-sm transition-colors"
                style={{ color: 'var(--ink-muted)' }}
                onMouseOver={e => (e.currentTarget.style.color = 'var(--brand)')}
                onMouseOut={e => (e.currentTarget.style.color = 'var(--ink-muted)')}>
                {crumb.label}
              </Link>
            ) : (
              <span className="text-sm font-semibold" style={{ color: 'var(--ink-primary)' }}>
                {crumb.label}
              </span>
            )}
          </span>
        ))}
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        {actions}
        <ThemeToggle />
        <button className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-all"
          style={{ color: 'var(--ink-secondary)', border: '1px solid var(--border)', background: 'var(--surface-3)' }}>
          <Bell size={15} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full"
            style={{ background: 'var(--brand)' }} />
        </button>
      </div>
    </header>
  );
}
