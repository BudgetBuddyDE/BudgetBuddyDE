'use client';
import {Menu as MenuPrimitive} from '@base-ui/react/menu';

import {
  BarChart3,
  ChevronLeft,
  Command,
  CreditCard,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu as MenuIcon,
  PiggyBank,
  Plus,
  ReceiptText,
  Repeat2,
  Search,
  Settings,
  Tags,
  UserRound,
  X,
} from 'lucide-react';
import Link from 'next/link';
import {usePathname, useRouter} from 'next/navigation';
import {BrandLogo} from '@/components/brand-logo';
import {useEffect, useRef, useState} from 'react';
import {authClient} from '@/authClient';
import {CommandPalette} from '@/components/command-palette';
import {useFeedback} from '@/components/feedback-provider';
import {StatePanel} from '@/components/shared';
import {Button, IconButton} from '@/components/ui/primitives';
import {FinanceProvider} from '@/lib/finance-provider';
import {useI18n} from '@/lib/i18n';
import {ThemeToggle} from '@/theme/theme-provider';
import {cn} from '@/utils/cn';

const NAVIGATION = [
  {href: '/dashboard', labelKey: 'nav.overview', icon: LayoutDashboard},
  {href: '/transactions', labelKey: 'nav.transactions', icon: ReceiptText},
  {href: '/recurring-payments', labelKey: 'nav.recurring', icon: Repeat2},
  {href: '/categories', labelKey: 'nav.categories', icon: Tags},
  {href: '/payment-methods', labelKey: 'nav.paymentMethods', icon: CreditCard},
  {href: '/budgets', labelKey: 'nav.budgets', icon: PiggyBank},
  {href: '/reporting', labelKey: 'nav.reporting', icon: BarChart3},
  {href: '/attachments', labelKey: 'nav.attachments', icon: FileText},
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
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const {showToast} = useFeedback();
  const {t} = useI18n();
  const mobileMenuRef = useRef<HTMLButtonElement>(null);
  const mobileCloseRef = useRef<HTMLButtonElement>(null);

  useEffect(() => setMobileOpen(false), [pathname]);

  const openMobileNavigation = () => {
    setMobileOpen(true);
    requestAnimationFrame(() => mobileCloseRef.current?.focus());
  };
  const closeMobileNavigation = () => {
    setMobileOpen(false);
    requestAnimationFrame(() => mobileMenuRef.current?.focus());
  };

  const signOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      const {error} = await authClient.signOut();
      if (error) {
        showToast({message: error.message ?? t('shell.signOutFailed'), tone: 'error'});
        return;
      }
      router.replace('/sign-in');
      router.refresh();
    } catch (cause) {
      showToast({message: cause instanceof Error ? cause.message : t('shell.signOutFailed'), tone: 'error'});
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <div className={cn('app-shell', collapsed && 'sidebar-collapsed')}>
      <a className="skip-link" href="#main-content">
        {t('shell.skipContent')}
      </a>
      {mobileOpen && (
        <button className="mobile-scrim" aria-label={t('shell.closeNavigation')} onClick={closeMobileNavigation} />
      )}
      <aside
        className={cn('sidebar', mobileOpen && 'mobile-open')}
        onKeyDown={event => {
          if (event.key === 'Escape') closeMobileNavigation();
        }}
      >
        <div className="brand-row">
          <Link href="/dashboard" className="brand" aria-label={t('shell.home')}>
            <BrandLogo compact={collapsed} onDark alt="" />
          </Link>
          <IconButton
            ref={mobileCloseRef}
            className="mobile-close"
            aria-label={t('shell.closeNavigation')}
            onClick={closeMobileNavigation}
          >
            <X size={19} />
          </IconButton>
        </div>
        <Button className="quick-add" onClick={() => setPaletteOpen(true)}>
          <Plus size={17} />
          <span>{t('shell.quickAdd')}</span>
          <kbd>⌘ K</kbd>
        </Button>
        <nav className="nav-list" aria-label={t('shell.primaryNavigation')}>
          <p className="nav-label">{t('shell.workspace')}</p>
          {NAVIGATION.map(item => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn('nav-item', active && 'active')}
                aria-current={active ? 'page' : undefined}
                title={collapsed ? t(item.labelKey) : undefined}
              >
                <item.icon size={18} />
                <span>{t(item.labelKey)}</span>
              </Link>
            );
          })}
          <p className="nav-label nav-label-secondary">{t('shell.account')}</p>
          <Link
            href="/settings/profile"
            className={cn('nav-item', pathname.startsWith('/settings') && 'active')}
            aria-current={pathname.startsWith('/settings') ? 'page' : undefined}
            title={collapsed ? t('shell.settings') : undefined}
          >
            <Settings size={18} />
            <span>{t('shell.settings')}</span>
          </Link>
          <button
            className="nav-item sidebar-sign-out"
            disabled={signingOut}
            title={collapsed ? t('shell.signOut') : undefined}
            onClick={() => void signOut()}
          >
            <LogOut size={18} />
            <span>{signingOut ? t('shell.signingOut') : t('shell.signOut')}</span>
          </button>
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
            aria-label={collapsed ? t('shell.expandSidebar') : t('shell.collapseSidebar')}
          >
            <ChevronLeft size={17} />
            <span>{t('shell.collapse')}</span>
          </button>
        </div>
      </aside>
      <section className="workspace" aria-hidden={mobileOpen || undefined} inert={mobileOpen}>
        <header className="topbar">
          <IconButton
            ref={mobileMenuRef}
            className="mobile-menu"
            aria-label={t('shell.openNavigation')}
            onClick={openMobileNavigation}
          >
            <MenuIcon size={20} />
          </IconButton>
          <button className="search-trigger" onClick={() => setPaletteOpen(true)}>
            <Search size={17} />
            <span>{t('shell.search')}</span>
            <kbd>
              <Command size={12} />K
            </kbd>
          </button>
          <div className="topbar-actions">
            <ThemeToggle />
            <MenuPrimitive.Root>
              <MenuPrimitive.Trigger className="topbar-avatar" aria-label={t('shell.openUserMenu')} title={userName}>
                {userName.slice(0, 1).toLocaleUpperCase()}
              </MenuPrimitive.Trigger>
              <MenuPrimitive.Portal>
                <MenuPrimitive.Positioner sideOffset={8} align="end" className="menu-positioner">
                  <MenuPrimitive.Popup className="menu-popup" aria-label={t('shell.userMenu')}>
                    <div className="menu-user">
                      <strong>{userName}</strong>
                      <small>{userEmail}</small>
                    </div>
                    <MenuPrimitive.Item className="menu-item" onClick={() => router.push('/settings/profile')}>
                      <UserRound size={16} /> {t('shell.profileSettings')}
                    </MenuPrimitive.Item>
                    <MenuPrimitive.Item
                      className="menu-item menu-item-danger"
                      disabled={signingOut}
                      onClick={() => void signOut()}
                    >
                      <LogOut size={16} /> {signingOut ? t('shell.signingOut') : t('shell.signOut')}
                    </MenuPrimitive.Item>
                  </MenuPrimitive.Popup>
                </MenuPrimitive.Positioner>
              </MenuPrimitive.Portal>
            </MenuPrimitive.Root>
          </div>
        </header>
        <main id="main-content" className="main-content">
          {children}
        </main>
      </section>
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </div>
  );
}

export function AppShell({children}: {children: React.ReactNode}) {
  const router = useRouter();
  const {t} = useI18n();
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
        <StatePanel state="error" title={t('shell.sessionUnavailable')} description={t('shell.redirecting')} />
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
