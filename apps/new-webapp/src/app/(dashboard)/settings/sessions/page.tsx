import type {Metadata} from 'next';
import {headers} from 'next/headers';
import {authClient} from '@/authClient';
import {PageShell} from '@/components/page-shell';
import {SessionWorkspace} from '@/components/settings/session-workspace';
import {requireSession} from '@/serverAuth';

export const metadata: Metadata = {title: 'Sessions'};

export default async function SessionsPage() {
  const session = await requireSession();
  const result = await authClient.listSessions({fetchOptions: {headers: await headers(), cache: 'no-store'}});
  return (
    <PageShell title="Sessions" description="Review signed-in devices and revoke access immediately.">
      {result.error ? (
        <p role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          Sessions could not be loaded.
        </p>
      ) : (
        <SessionWorkspace initialSessions={result.data ?? []} activeToken={session.session.token} />
      )}
    </PageShell>
  );
}
