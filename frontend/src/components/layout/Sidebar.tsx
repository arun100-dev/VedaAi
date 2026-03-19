'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Users, FileText, Cpu, BookOpen, Settings, Plus, Bell, ChevronDown, Wifi, WifiOff, LogOut } from 'lucide-react';
import { useAssignmentStore } from '../../store/assignmentStore';
import { useAuthStore } from '../../store/authStore';
import { clsx } from 'clsx';

const navItems = [
  { label: 'Home', href: '/', icon: Home },
  { label: 'My Groups', href: '/groups', icon: Users },
  { label: 'Assignments', href: '/assignments', icon: FileText, badge: true },
  { label: "AI Teacher's Toolkit", href: '/toolkit', icon: Cpu },
  { label: 'My Library', href: '/library', icon: BookOpen },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { totalAssignments, wsConnected } = useAssignmentStore();
  const { user, logout } = useAuthStore();

  function handleLogout() {
    logout();
    router.push('/login');
  }

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  return (
    <aside className="w-[240px] min-h-screen flex flex-col fixed left-0 top-0 z-30"
      style={{ background: 'var(--surface-1)', borderRight: '1px solid var(--border)' }}>

      {/* Logo */}
      <div className="p-5 pb-4">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #f97316, #ea6c0a)' }}>
            <span className="text-white font-bold text-sm">V</span>
            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
          </div>
          <span className="font-bold text-lg" style={{ color: 'var(--ink-primary)', letterSpacing: '-0.02em' }}>
            VedaAI
          </span>
        </Link>
      </div>

      {/* Create Button */}
      <div className="px-4 pb-5">
        <Link href="/assignments/new" className="btn-primary w-full justify-center text-sm py-2.5">
          <Plus size={15} strokeWidth={2.5} />
          Create Assignment
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-0.5">
        {navItems.map(({ label, href, icon: Icon, badge }) => {
          const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <Link key={href} href={href} className={clsx('nav-item', isActive && 'active')}>
              <Icon size={16} strokeWidth={isActive ? 2 : 1.5} />
              <span className="flex-1">{label}</span>
              {badge && totalAssignments > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{
                    background: isActive ? 'var(--brand)' : 'var(--surface-4)',
                    color: isActive ? 'white' : 'var(--ink-secondary)',
                    minWidth: '20px', textAlign: 'center',
                  }}>
                  {totalAssignments > 99 ? '99+' : totalAssignments}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="p-3 space-y-2">
        {/* WS Status */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg"
          style={{ background: 'var(--surface-2)' }}>
          {wsConnected ? (
            <><Wifi size={13} style={{ color: '#22c55e' }} />
              <span className="text-[11px]" style={{ color: '#22c55e' }}>Live updates active</span></>
          ) : (
            <><WifiOff size={13} style={{ color: 'var(--ink-muted)' }} />
              <span className="text-[11px]" style={{ color: 'var(--ink-muted)' }}>Connecting...</span></>
          )}
        </div>

        <Link href="/settings" className="nav-item">
          <Settings size={16} strokeWidth={1.5} />
          Settings
        </Link>

        {/* Logout */}
        <button onClick={handleLogout}
          className="nav-item w-full text-left"
          style={{ color: '#f87171' }}
          onMouseOver={e => (e.currentTarget.style.background = 'rgba(248,113,113,0.1)')}
          onMouseOut={e => (e.currentTarget.style.background = 'transparent')}>
          <LogOut size={16} strokeWidth={1.5} />
          Sign Out
        </button>

        {/* User profile */}
        <div className="flex items-center gap-3 p-2.5 rounded-xl"
          style={{ border: '1px solid var(--border)' }}>
          <div className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-white text-xs font-bold"
            style={{ background: 'linear-gradient(135deg, #f97316 0%, #a78bfa 100%)' }}>
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate" style={{ color: 'var(--ink-primary)' }}>
              {user?.name || 'Teacher'}
            </p>
            <p className="text-[10px] truncate" style={{ color: 'var(--ink-muted)' }}>
              {user?.school || user?.email || ''}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
