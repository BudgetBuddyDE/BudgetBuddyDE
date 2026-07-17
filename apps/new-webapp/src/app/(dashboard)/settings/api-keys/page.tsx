import type {Metadata} from 'next';
import {PageShell} from '@/components/page-shell';
import {ApiKeyWorkspace} from '@/components/settings/api-key-workspace';
import {requireSession} from '@/serverAuth';

export const metadata: Metadata = {title: 'API keys'};

export default async function ApiKeysPage() {
  await requireSession();
  return (
    <PageShell
      title="API keys"
      description="Create and immediately revoke programmatic access. Secrets are shown once."
    >
      <ApiKeyWorkspace />
    </PageShell>
  );
}
