'use client';

import {useRouter} from 'next/navigation';
import {type FormEvent, useState} from 'react';
import {authClient} from '@/authClient';
import {Button} from '@/components/ui/button';
import {DialogShell} from '@/components/ui/dialog';
import {Input} from '@/components/ui/input';

export function ProfileSettings({name, email}: {name: string; email: string}) {
  const router = useRouter();
  const [status, setStatus] = useState<{kind: 'error' | 'success'; message: string}>();
  const [pending, setPending] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const run = async (action: () => Promise<{error?: {message?: string} | null}>, success: string) => {
    setPending(true);
    const result = await action();
    setPending(false);
    setStatus(
      result.error
        ? {kind: 'error', message: result.error.message ?? 'The account change failed.'}
        : {kind: 'success', message: success},
    );
    if (!result.error) router.refresh();
  };
  const updateProfile = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const nextName = String(data.get('name') ?? '').trim();
    const nextEmail = String(data.get('email') ?? '').trim();
    if (!nextName || !nextEmail) {
      setStatus({kind: 'error', message: 'Name and email are required.'});
      return;
    }
    void run(
      async () => {
        const nameResult = nextName === name ? {error: null} : await authClient.updateUser({name: nextName});
        if (nameResult.error || nextEmail === email) return nameResult;
        return authClient.changeEmail({newEmail: nextEmail, callbackURL: `${window.location.origin}/email/changed`});
      },
      nextEmail === email ? 'Profile updated.' : 'Check your current email address to confirm the change.',
    );
  };
  const updatePassword = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const currentPassword = String(data.get('currentPassword') ?? '');
    const newPassword = String(data.get('newPassword') ?? '');
    if (newPassword.length < 8) {
      setStatus({kind: 'error', message: 'The new password must contain at least 8 characters.'});
      return;
    }
    void run(
      () => authClient.changePassword({currentPassword, newPassword, revokeOtherSessions: true}),
      'Password changed. Other sessions were revoked.',
    );
  };
  const deleteAccount = async () => {
    setPending(true);
    const result = await authClient.deleteUser({
      password: deletePassword || undefined,
      callbackURL: `${window.location.origin}/user/confirm-deletion`,
    });
    setPending(false);
    if (result.error) {
      setStatus({kind: 'error', message: result.error.message ?? 'Account deletion could not be started.'});
      return;
    }
    setDeleteOpen(false);
    router.push('/sign-in');
  };
  return (
    <div className="space-y-6">
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
      <form onSubmit={updateProfile} className="space-y-4 rounded-xl border bg-card p-5">
        <div>
          <h2 className="font-semibold">Profile</h2>
          <p className="text-sm text-muted-foreground">Email changes require confirmation at the current address.</p>
        </div>
        <label className="block space-y-1 text-sm font-medium">
          Name
          <Input name="name" aria-label="Profile name" defaultValue={name} />
        </label>
        <label className="block space-y-1 text-sm font-medium">
          Email
          <Input name="email" aria-label="Profile email" type="email" defaultValue={email} />
        </label>
        <Button type="submit" disabled={pending}>
          Save profile
        </Button>
      </form>
      <form onSubmit={updatePassword} className="space-y-4 rounded-xl border bg-card p-5">
        <div>
          <h2 className="font-semibold">Password</h2>
          <p className="text-sm text-muted-foreground">Changing the password revokes every other signed-in session.</p>
        </div>
        <label className="block space-y-1 text-sm font-medium">
          Current password
          <Input name="currentPassword" aria-label="Current password" type="password" autoComplete="current-password" />
        </label>
        <label className="block space-y-1 text-sm font-medium">
          New password
          <Input name="newPassword" aria-label="New password" type="password" autoComplete="new-password" />
        </label>
        <Button type="submit" disabled={pending}>
          Change password
        </Button>
      </form>
      <section className="rounded-xl border border-destructive/40 bg-card p-5">
        <h2 className="font-semibold text-destructive">Delete account</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Permanently removes the account and its finance data after authentication-service confirmation.
        </p>
        <Button className="mt-4" variant="destructive" onClick={() => setDeleteOpen(true)}>
          Delete account
        </Button>
      </section>
      <DialogShell
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete account permanently?"
        description="This action cannot be undone. Enter your password to confirm."
        footer={
          <>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" disabled={pending} onClick={deleteAccount}>
              {pending ? 'Deleting…' : 'Delete my account'}
            </Button>
          </>
        }
      >
        <label className="block space-y-1 text-sm font-medium">
          Password
          <Input
            aria-label="Deletion password"
            type="password"
            value={deletePassword}
            onChange={event => setDeletePassword(event.target.value)}
          />
        </label>
      </DialogShell>
    </div>
  );
}
