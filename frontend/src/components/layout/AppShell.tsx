'use client';
import Sidebar from './Sidebar';
import { useWebSocket } from '../../hooks/useWebSocket';
import AuthGuard from '../auth/AuthGuard';

export default function AppShell({ children }: { children: React.ReactNode }) {
  useWebSocket();
  return (
    <AuthGuard>
      <div className="flex min-h-screen" style={{ background: 'var(--surface-0)' }}>
        <Sidebar />
        <main className="flex-1 ml-[240px] min-h-screen flex flex-col">
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}
