'use client';

import {LogOut, Settings} from 'lucide-react';
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {useEffect, useRef, useState} from 'react';
import {authClient} from '@/authClient';
import {Avatar} from '@/components/avatar';
import {cn} from '@/utils/cn';

export function UserMenu({
  name,
  email,
  image,
  placement,
}: {
  name: string;
  email: string;
  image?: string | null;
  placement: 'sidebar' | 'topbar';
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const closeTimeout = useRef<number | null>(null);
  const sidebar = placement === 'sidebar';

  useEffect(
    () => () => {
      if (closeTimeout.current !== null) window.clearTimeout(closeTimeout.current);
    },
    [],
  );

  const openMenu = () => {
    if (closeTimeout.current !== null) window.clearTimeout(closeTimeout.current);
    setOpen(true);
  };
  const scheduleClose = () => {
    closeTimeout.current = window.setTimeout(() => setOpen(false), 120);
  };

  const signOut = async () => {
    await authClient.signOut();
    router.replace('/sign-in');
  };

  const closeAfterFocusLeaves = (event: React.FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
  };

  return (
    <div
      className={cn('user-menu', `user-menu-${placement}`)}
      onMouseEnter={openMenu}
      onMouseLeave={scheduleClose}
      onFocusCapture={openMenu}
      onBlurCapture={closeAfterFocusLeaves}
    >
      <button
        className={cn('user-menu-trigger', sidebar ? 'user-chip' : 'topbar-avatar-link')}
        aria-label={sidebar ? 'Open sidebar account menu' : 'Open account menu'}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Avatar name={name} image={image} size={sidebar ? 'md' : 'sm'} />
        {sidebar && (
          <span className="user-menu-identity">
            <strong>{name}</strong>
            <small>{email}</small>
          </span>
        )}
      </button>
      {open && (
        <div className="account-menu" role="menu" aria-label={sidebar ? 'Sidebar account' : 'Account'}>
          <div className="account-menu-heading">
            <strong>{name}</strong>
            <small>{email}</small>
          </div>
          <Link href="/settings/profile" role="menuitem" onClick={() => setOpen(false)}>
            <Settings size={16} /> Settings
          </Link>
          <button role="menuitem" onClick={() => void signOut()}>
            <LogOut size={16} /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}
