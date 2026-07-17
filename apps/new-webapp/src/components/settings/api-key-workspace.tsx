'use client';

import {Copy, KeyRound, Plus, Trash2} from 'lucide-react';
import {useCallback, useEffect, useState} from 'react';
import {authClient} from '@/authClient';
import {ConfirmDialog} from '@/components/confirm-dialog';
import {Button} from '@/components/ui/button';
import {DialogShell} from '@/components/ui/dialog';
import {Input} from '@/components/ui/input';
import {formatDate} from '@/utils/date';

interface ApiKeyRecord {
  id: string;
  name: string | null;
  enabled: boolean;
  createdAt: Date | string;
  expiresAt: Date | string | null;
}

export function ApiKeyWorkspace() {
  const [keys, setKeys] = useState<ApiKeyRecord[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [expiresInDays, setExpiresInDays] = useState('');
  const [createdKey, setCreatedKey] = useState('');
  const [acknowledged, setAcknowledged] = useState(false);
  const [deleting, setDeleting] = useState<ApiKeyRecord>();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();
  const load = useCallback(async () => {
    setPending(true);
    const result = await authClient.apiKey.list({query: {limit: 100, offset: 0}});
    setPending(false);
    if (result.error) {
      setError(result.error.message ?? 'API keys could not be loaded.');
      return;
    }
    setKeys((result.data?.apiKeys ?? []) as ApiKeyRecord[]);
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  const create = async () => {
    const trimmedName = name.trim();
    const days = expiresInDays ? Number(expiresInDays) : undefined;
    if (!trimmedName) {
      setError('Enter an API key name.');
      return;
    }
    if (days !== undefined && (!Number.isInteger(days) || days < 1 || days > 3650)) {
      setError('Expiration must be between 1 and 3650 days.');
      return;
    }
    setPending(true);
    const result = await authClient.apiKey.create({name: trimmedName, ...(days ? {expiresIn: days * 86400} : {})});
    setPending(false);
    if (result.error || !result.data?.key) {
      setError(result.error?.message ?? 'The API key value was not returned.');
      return;
    }
    setCreateOpen(false);
    setCreatedKey(result.data.key);
    setAcknowledged(false);
    setName('');
    setExpiresInDays('');
    await load();
  };
  const remove = async () => {
    if (!deleting) return;
    setPending(true);
    const result = await authClient.apiKey.delete({keyId: deleting.id});
    setPending(false);
    if (result.error) {
      setError(result.error.message ?? 'The API key could not be revoked.');
      return;
    }
    setKeys(current => current.filter(key => key.id !== deleting.id));
    setDeleting(undefined);
  };
  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <Button onClick={() => setCreateOpen(true)}>
          <Plus aria-hidden="true" className="size-4" />
          Create API key
        </Button>
      </div>
      {error ? (
        <p role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      {pending && !keys.length ? (
        <p role="status" className="text-sm text-muted-foreground">
          Loading API keys…
        </p>
      ) : keys.length ? (
        <div className="space-y-3">
          {keys.map(key => (
            <article key={key.id} className="flex items-center gap-3 rounded-xl border bg-card p-4">
              <KeyRound aria-hidden="true" className="size-5 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <h2 className="truncate font-medium">{key.name || 'Unnamed key'}</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Created {formatDate(key.createdAt)} ·{' '}
                  {key.expiresAt ? `Expires ${formatDate(key.expiresAt)}` : 'Never expires'} ·{' '}
                  {key.enabled ? 'Enabled' : 'Disabled'}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Revoke ${key.name || 'API key'}`}
                onClick={() => setDeleting(key)}
              >
                <Trash2 aria-hidden="true" className="size-4" />
              </Button>
            </article>
          ))}
        </div>
      ) : (
        <p className="rounded-xl border bg-card p-5 text-sm text-muted-foreground">No API keys.</p>
      )}
      <DialogShell
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Create API key"
        description="The secret is shown exactly once. Store it in a password manager."
        footer={
          <>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={create} disabled={pending}>
              Create key
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <label className="block space-y-1 text-sm font-medium">
            Name
            <Input aria-label="API key name" value={name} onChange={event => setName(event.target.value)} />
          </label>
          <label className="block space-y-1 text-sm font-medium">
            Expires in days (optional)
            <Input
              aria-label="API key expiration"
              type="number"
              min="1"
              max="3650"
              value={expiresInDays}
              onChange={event => setExpiresInDays(event.target.value)}
            />
          </label>
        </div>
      </DialogShell>
      <DialogShell
        open={Boolean(createdKey)}
        onOpenChange={() => undefined}
        title="Copy your API key now"
        description="This secret cannot be displayed again."
        footer={
          <Button disabled={!acknowledged} onClick={() => setCreatedKey('')}>
            I stored the key
          </Button>
        }
      >
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input aria-label="Created API key" readOnly value={createdKey} />
            <Button
              variant="outline"
              size="icon"
              aria-label="Copy API key"
              onClick={() => void navigator.clipboard.writeText(createdKey)}
            >
              <Copy aria-hidden="true" className="size-4" />
            </Button>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={acknowledged} onChange={event => setAcknowledged(event.target.checked)} />I
            understand this key is shown once.
          </label>
        </div>
      </DialogShell>
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={open => !open && setDeleting(undefined)}
        title="Revoke API key?"
        description="Applications using this key will lose access immediately."
        confirmLabel="Revoke API key"
        pending={pending}
        onConfirm={remove}
      />
    </div>
  );
}
