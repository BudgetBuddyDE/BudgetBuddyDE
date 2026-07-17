'use client';

import type {Session} from 'better-auth';
import {Monitor, Trash2} from 'lucide-react';
import {useRouter} from 'next/navigation';
import {useState} from 'react';
import {authClient} from '@/authClient';
import {ConfirmDialog} from '@/components/confirm-dialog';
import {Button} from '@/components/ui/button';
import {formatDate} from '@/utils/date';

export function SessionWorkspace({initialSessions, activeToken}: {initialSessions: Session[]; activeToken: string}) {
  const router = useRouter();
  const [sessions, setSessions] = useState(initialSessions);
  const [revoking, setRevoking] = useState<Session>();
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<{kind: 'error' | 'success'; message: string}>();
  const revoke = async () => {
    if (!revoking) return;
    setPending(true);
    const result = await authClient.revokeSession({token: revoking.token});
    setPending(false);
    if (result.error) {
      setStatus({kind: 'error', message: result.error.message ?? 'Session could not be revoked.'});
      return;
    }
    setSessions(current => current.filter(session => session.token !== revoking.token));
    const revokedCurrent = revoking.token === activeToken;
    setRevoking(undefined);
    if (revokedCurrent) router.push('/sign-in');
    else setStatus({kind: 'success', message: 'Session revoked.'});
  };
  const revokeOthers = async () => {
    setPending(true);
    const result = await authClient.revokeOtherSessions();
    setPending(false);
    if (result.error) {
      setStatus({kind: 'error', message: result.error.message ?? 'Other sessions could not be revoked.'});
      return;
    }
    setSessions(current => current.filter(session => session.token === activeToken));
    setStatus({kind: 'success', message: 'All other sessions revoked.'});
  };
  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <Button variant="outline" disabled={pending || sessions.length <= 1} onClick={revokeOthers}>
          Revoke all other sessions
        </Button>
      </div>
      {status ? (
        <p
          role={status.kind === 'error' ? 'alert' : 'status'}
          className={
            status.kind === 'error'
              ? 'rounded-md bg-destructive/10 p-3 text-sm text-destructive'
              : 'rounded-md bg-success/10 p-3 text-sm'
          }
        >
          {status.message}
        </p>
      ) : null}
      <div className="space-y-3">
        {sessions.map(session => {
          const active = session.token === activeToken;
          return (
            <article
              key={session.id}
              className="flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-center"
            >
              <Monitor aria-hidden="true" className="size-5 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-medium">{session.userAgent || 'Unknown device'}</h2>
                  {active ? (
                    <span className="rounded-full bg-success/15 px-2 py-0.5 text-xs font-medium">Current session</span>
                  ) : null}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  IP {session.ipAddress || 'unknown'} · Created {formatDate(session.createdAt)} · Expires{' '}
                  {formatDate(session.expiresAt)}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Revoke ${active ? 'current session' : session.userAgent || 'session'}`}
                onClick={() => setRevoking(session)}
              >
                <Trash2 aria-hidden="true" className="size-4" />
              </Button>
            </article>
          );
        })}
      </div>
      <ConfirmDialog
        open={Boolean(revoking)}
        onOpenChange={open => !open && setRevoking(undefined)}
        title="Revoke session?"
        description={
          revoking?.token === activeToken
            ? 'You will be signed out on this device immediately.'
            : 'This device will need to sign in again.'
        }
        confirmLabel="Revoke session"
        pending={pending}
        onConfirm={revoke}
      />
    </div>
  );
}
