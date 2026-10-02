'use client';

import {AppShell, AppShellHeader, AppShellMain, AppShellNavbar, Drawer, useMantineTheme} from '@mantine/core';
import {useMediaQuery} from '@mantine/hooks';
import {usePathname} from 'next/navigation';
import {useEffect, useState, type ReactNode} from 'react';
import {Branding} from '@/components/Branding/Branding';
import {AppBar} from '@/compositions/AppBar/AppBar';
import {Sidebar} from '@/compositions/Sidebar/Sidebar';
import classes from './AppLayout.module.css';
import {navigation} from './navigation';

export function AppLayout({children}: {children: ReactNode}) {
  const pathname = usePathname();
  const theme = useMantineTheme();
  const isDesktop = useMediaQuery(`(min-width: ${theme.breakpoints.md})`);
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);
  const [mobileOpened, setMobileOpened] = useState(false);

  useEffect(() => {
    setMobileOpened(false);
  }, [pathname]);

  useEffect(() => {
    if (isDesktop) setMobileOpened(false);
  }, [isDesktop]);

  const items = navigation.map(item => ({
    ...item,
    active: pathname === item.matchPath || pathname.startsWith(`${item.matchPath}/`),
  }));
  const closeMobile = () => setMobileOpened(false);

  return (
    <AppShell
      layout="alt"
      header={{height: 64}}
      padding={{base: 16, md: 24}}
      navbar={{width: desktopCollapsed ? 76 : 280, breakpoint: 'md', collapsed: {mobile: true}}}
    >
      <AppShellHeader>
        <AppBar
          desktopCollapsed={desktopCollapsed}
          mobileOpened={mobileOpened}
          onToggleDesktop={() => setDesktopCollapsed(value => !value)}
          onOpenMobile={() => setMobileOpened(true)}
        />
      </AppShellHeader>
      <AppShellNavbar id="desktop-navigation" visibleFrom="md">
        <Sidebar items={items} collapsed={desktopCollapsed} />
      </AppShellNavbar>
      <AppShellMain className={classes.main}>{children}</AppShellMain>
      <Drawer
        id="mobile-navigation"
        opened={mobileOpened}
        onClose={closeMobile}
        position="left"
        size="min(80vw, 360px)"
        title={<Branding onNavigate={closeMobile} />}
        closeButtonProps={{'aria-label': 'Close navigation'}}
        overlayProps={{backgroundOpacity: 0.5}}
        classNames={{content: classes.drawerContent, body: classes.drawerBody}}
      >
        <Sidebar items={items} showBranding={false} onNavigate={closeMobile} />
      </Drawer>
    </AppShell>
  );
}
