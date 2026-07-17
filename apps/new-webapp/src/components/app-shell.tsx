'use client';

import {Dialog} from '@base-ui/react/dialog';
import {
  BarChart3,
  ChartNoAxesCombined,
  CreditCard,
  Gauge,
  Menu,
  Paperclip,
  PiggyBank,
  ReceiptText,
  Repeat2,
  Search,
  Settings,
  Shapes,
  Upload,
  X,
} from 'lucide-react';
import Link from 'next/link';
import {usePathname, useRouter} from 'next/navigation';
import {type ReactNode, useEffect, useState} from 'react';
import {authClient} from '@/authClient';
import {CommandPalette} from '@/components/command-palette';
import {ThemeToggle} from '@/components/theme-toggle';
import {Button} from '@/components/ui/button';
import {cn} from '@/utils/cn';

const navigation = [
  {href: '/dashboard', label: 'Dashboard', icon: Gauge},
  {href: '/transactions', label: 'Transactions', icon: ReceiptText},
  {href: '/categories', label: 'Categories', icon: Shapes},
  {href: '/payment-methods', label: 'Payment methods', icon: CreditCard},
  {href: '/recurring-payments', label: 'Recurring payments', icon: Repeat2},
  {href: '/budgets', label: 'Budgets', icon: PiggyBank},
  {href: '/analytics', label: 'Analytics', icon: BarChart3},
  {href: '/reports', label: 'Reports', icon: ChartNoAxesCombined},
  {href: '/attachments', label: 'Attachments', icon: Paperclip},
  {href: '/import-export', label: 'Import & export', icon: Upload},
  {href: '/settings/profile', label: 'Settings', icon: Settings},
] as const;

function Navigation({pathname, onNavigate}: {pathname: string; onNavigate?: () => void}) {
  return (
    <nav aria-label="Primary navigation" className="space-y-1">
      {navigation.map(({href, label, icon: Icon}) => {
        const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(`${href}/`));
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex h-9 items-center gap-3 rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground',
              active && 'bg-accent text-accent-foreground',
            )}
          >
            <Icon aria-hidden="true" className="size-4 shrink-0" />
            <span className="truncate">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({children, userName}: {children: ReactNode; userName: string}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [signOutError, setSignOutError] = useState(false);

  useEffect(() => {
    const openCommands = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLocaleLowerCase() === 'k') {
        event.preventDefault();
        setCommandOpen(true);
      }
    };
    window.addEventListener('keydown', openCommands);
    return () => window.removeEventListener('keydown', openCommands);
  }, []);

  const signOut = async () => {
    setSignOutError(false);
    const result = await authClient.signOut();
    if (result.error) {
      setSignOutError(true);
      return;
    }
    router.push('/sign-in');
    router.refresh();
  };

  return (
    <div className="min-h-dvh md:grid md:grid-cols-[15rem_minmax(0,1fr)]">
      <aside className="hidden border-r bg-card md:sticky md:top-0 md:block md:h-dvh">
        <div className="flex h-14 items-center border-b px-4 text-sm font-bold tracking-wide">BudgetBuddy</div>
        <div className="h-[calc(100dvh-3.5rem)] overflow-y-auto p-3">
          <Navigation pathname={pathname} />
        </div>
      </aside>
      <div className="min-w-0">
        <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b bg-background/95 px-3 backdrop-blur md:px-5">
          <Button
            className="md:hidden"
            variant="ghost"
            size="icon"
            aria-label="Open navigation"
            onClick={() => setMobileOpen(true)}
          >
            <Menu aria-hidden="true" className="size-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{userName}</p>
          </div>
          <Button variant="outline" size="sm" aria-label="Open command palette" onClick={() => setCommandOpen(true)}>
            <Search aria-hidden="true" className="size-4" />
            <span className="hidden sm:inline">Search</span>
            <kbd className="hidden rounded border px-1 text-[10px] text-muted-foreground lg:inline">Ctrl K</kbd>
          </Button>
          <ThemeToggle />
          <Button variant="outline" size="sm" onClick={signOut}>
            Sign out
          </Button>
        </header>
        {signOutError ? (
          <p role="alert" className="border-b bg-destructive/10 px-5 py-2 text-sm text-destructive">
            Sign out failed. Try again.
          </p>
        ) : null}
        <main className="mx-auto w-full max-w-[100rem] p-4 md:p-6">{children}</main>
      </div>
      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
      <Dialog.Root open={mobileOpen} onOpenChange={setMobileOpen}>
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/45 md:hidden" />
          <Dialog.Popup className="fixed inset-y-0 left-0 z-50 w-[min(18rem,85vw)] border-r bg-card p-3 shadow-xl transition-transform data-ending-style:-translate-x-full data-starting-style:-translate-x-full md:hidden">
            <div className="mb-3 flex h-11 items-center justify-between px-2">
              <Dialog.Title className="font-bold">BudgetBuddy</Dialog.Title>
              <Dialog.Close render={<Button variant="ghost" size="icon" aria-label="Close navigation" />}>
                <X aria-hidden="true" className="size-4" />
              </Dialog.Close>
            </div>
            <Navigation pathname={pathname} onNavigate={() => setMobileOpen(false)} />
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
