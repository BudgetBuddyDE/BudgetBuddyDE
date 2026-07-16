'use client';

import {
  BarChart3,
  Bell,
  ChevronLeft,
  Command,
  CreditCard,
  FileText,
  Gauge,
  LayoutDashboard,
  Menu,
  Moon,
  PiggyBank,
  Plus,
  ReceiptText,
  Repeat2,
  Search,
  Settings,
  Sun,
  Tags,
  X,
} from 'lucide-react';
import Link from 'next/link';
import {usePathname, useRouter} from 'next/navigation';
import {useEffect, useState} from 'react';
import {authClient} from '@/authClient';
import {CommandPalette} from '@/components/command-palette';
import {StatePanel} from '@/components/shared';
import {Button, IconButton} from '@/components/ui/primitives';
import {FinanceProvider, useFinance} from '@/lib/finance-provider';
import {cn} from '@/utils/cn';

const NAVIGATION = [
  {href: '/dashboard', label: 'Overview', icon: LayoutDashboard},
  {href: '/transactions', label: 'Transactions', icon: ReceiptText},
  {href: '/recurring-payments', label: 'Recurring', icon: Repeat2},
  {href: '/categories', label: 'Categories', icon: Tags},
  {href: '/payment-methods', label: 'Payment methods', icon: CreditCard},
  {href: '/budgets', label: 'Budgets', icon: PiggyBank},
  {href: '/reporting', label: 'Reporting', icon: BarChart3},
  {href: '/attachments', label: 'Attachments', icon: FileText},
];

function ShellContent({
  userName,
  userEmail,
  children,
}: {
  userName: string;
  userEmail: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const {notice, clearNotice} = useFinance();

  useEffect(() => setMobileOpen(false), [pathname]);
  useEffect(() => {
    const preferred =
      localStorage.getItem('budgetbuddy-theme') ??
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    setDark(preferred === 'dark');
    document.documentElement.dataset.theme = preferred;
  }, []);
  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(clearNotice, 4200);
    return () => window.clearTimeout(timeout);
  }, [clearNotice, notice]);

  const toggleTheme = () => {
    const next = dark ? 'light' : 'dark';
    setDark(!dark);
    document.documentElement.dataset.theme = next;
    localStorage.setItem('budgetbuddy-theme', next);
  };

  return (
    <div className={cn('app-shell', collapsed && 'sidebar-collapsed')}>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      {mobileOpen && (
        <button className="mobile-scrim" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />
      )}
      <aside className={cn('sidebar', mobileOpen && 'mobile-open')}>
        <div className="brand-row">
          <Link href="/dashboard" className="brand" aria-label="BudgetBuddy home">
            <span className="brand-mark">
              <Gauge size={22} />
            </span>
            <span className="brand-copy">
              <strong>BudgetBuddy</strong>
              <small>Finance workspace</small>
            </span>
          </Link>
          <IconButton className="mobile-close" aria-label="Close navigation" onClick={() => setMobileOpen(false)}>
            <X size={19} />
          </IconButton>
        </div>
        <Button className="quick-add" onClick={() => setPaletteOpen(true)}>
          <Plus size={17} />
          <span>Quick add</span>
          <kbd>⌘ K</kbd>
        </Button>
        <nav className="nav-list" aria-label="Primary navigation">
          <p className="nav-label">Workspace</p>
          {NAVIGATION.map(item => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn('nav-item', active && 'active')}
                aria-current={active ? 'page' : undefined}
                title={collapsed ? item.label : undefined}
              >
                <item.icon size={18} />
                <span>{item.label}</span>
              </Link>
            );
          })}
          <p className="nav-label nav-label-secondary">Account</p>
          <Link
            href="/settings/profile"
            className={cn('nav-item', pathname.startsWith('/settings') && 'active')}
            aria-current={pathname.startsWith('/settings') ? 'page' : undefined}
            title={collapsed ? 'Settings' : undefined}
          >
            <Settings size={18} />
            <span>Settings</span>
          </Link>
        </nav>
        <div className="sidebar-footer">
          <div className="user-chip">
            <span className="avatar">{userName.slice(0, 1).toLocaleUpperCase()}</span>
            <span>
              <strong>{userName}</strong>
              <small>{userEmail}</small>
            </span>
          </div>
          <button
            className="collapse-button"
            onClick={() => setCollapsed(value => !value)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <ChevronLeft size={17} />
            <span>Collapse</span>
          </button>
        </div>
      </aside>
      <section className="workspace">
        <header className="topbar">
          <IconButton className="mobile-menu" aria-label="Open navigation" onClick={() => setMobileOpen(true)}>
            <Menu size={20} />
          </IconButton>
          <button className="search-trigger" onClick={() => setPaletteOpen(true)}>
            <Search size={17} />
            <span>Search or run a command</span>
            <kbd>
              <Command size={12} />K
            </kbd>
          </button>
          <div className="topbar-actions">
            <IconButton aria-label={dark ? 'Use light theme' : 'Use dark theme'} onClick={toggleTheme}>
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </IconButton>
            <IconButton aria-label="Notifications">
              <Bell size={18} />
            </IconButton>
            <Link href="/settings/profile" className="topbar-avatar" aria-label="Open profile">
              {userName.slice(0, 1).toLocaleUpperCase()}
            </Link>
          </div>
        </header>
        <main id="main-content" className="main-content">
          {children}
        </main>
      </section>
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
      {notice && (
        <div className="toast" role="status">
          {notice}
        </div>
      )}
    </div>
  );
}

export function AppShell({children}: {children: React.ReactNode}) {
  const router = useRouter();
  const {data: session, isPending, error} = authClient.useSession();

  useEffect(() => {
    if (!isPending && !session) router.replace('/sign-in');
  }, [isPending, router, session]);

  if (isPending)
    return (
      <div className="standalone-state">
        <StatePanel state="loading" />
      </div>
    );
  if (error || !session)
    return (
      <div className="standalone-state">
        <StatePanel state="error" title="Session unavailable" description="Redirecting you to sign in…" />
      </div>
    );

  const userName = session.user.name || session.user.email.split('@')[0];
  return (
    <FinanceProvider userId={session.user.id}>
      <ShellContent userName={userName} userEmail={session.user.email}>
        {children}
      </ShellContent>
    </FinanceProvider>
  );
}
