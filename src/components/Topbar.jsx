'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '/', label: 'Dashboard' },
  { href: '/tst', label: 'TST' },
];

export default function Topbar({ brandSub, updated, onRefresh, refreshing }) {
  const pathname = usePathname();

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <div className="brand">
          <div className="brand-mark">GO</div>
          <div>
            <div className="brand-title">GO Sumenep</div>
            <div className="brand-sub">{brandSub || 'Dashboard'}</div>
          </div>
        </div>

        <nav className="nav" aria-label="Navigasi utama">
          {TABS.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className={'nav-link' + (pathname === t.href ? ' active' : '')}
            >
              {t.label}
            </Link>
          ))}
        </nav>

        <div className="topbar-actions">
          {updated ? (
            <span className="updated">Terakhir diperbarui: {updated}</span>
          ) : null}
          <button className="btn btn-primary" onClick={onRefresh} disabled={refreshing}>
            {refreshing ? 'Memuat...' : 'Segarkan Data'}
          </button>
        </div>
      </div>
    </header>
  );
}
