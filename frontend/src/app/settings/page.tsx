'use client';
import AppShell from '../../components/layout/AppShell';
import Header from '../../components/layout/Header';
import { Settings } from 'lucide-react';
export default function SettingsPage() {
  return (
    <AppShell>
      <Header breadcrumbs={[{ label: 'Settings' }]} />
      <div className="flex-1 flex flex-col items-center justify-center p-6 page-enter">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'var(--surface-3)' }}>
          <Settings size={22} style={{ color: 'var(--brand)' }} />
        </div>
        <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--ink-primary)' }}>Settings</h2>
        <p className="text-sm" style={{ color: 'var(--ink-muted)' }}>Settings panel coming soon.</p>
      </div>
    </AppShell>
  );
}
