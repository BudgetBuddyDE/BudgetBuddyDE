'use client';

import type {Session} from 'better-auth';
import {
  Check,
  Clipboard,
  Database,
  Download,
  KeyRound,
  Laptop,
  MonitorSmartphone,
  Palette,
  Plus,
  Shield,
  Trash2,
  UploadCloud,
  UserRound,
} from 'lucide-react';
import {useRouter, useSearchParams} from 'next/navigation';
import {useEffect, useRef, useState} from 'react';
import {authClient} from '@/authClient';
import {Avatar} from '@/components/avatar';
import {PageHeader, SkeletonRows, StatePanel} from '@/components/shared';
import {Button, ConfirmDialog, DialogShell, SelectField, TextField} from '@/components/ui/primitives';
import {useFinance} from '@/lib/finance-provider';
import {createTransactionImportPreview, type ImportPreviewRow} from '@/utils/csv';
import {formatDate} from '@/utils/format';

type SettingsTab = 'profile' | 'preferences' | 'data' | 'sessions' | 'api-keys';
interface ApiKeyView {
  id: string;
  name: string | null;
  start: string | null;
  createdAt: Date;
  expiresAt: Date | null;
}
interface LinkedAccountView {
  id: string;
  accountId: string;
  providerId: string;
  createdAt: Date;
}

export function Settings() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {data: session, refetch: refetchSession} = authClient.useSession();
  const {data: financeData, createEntity} = useFinance();
  const tab = (searchParams.get('tab') as SettingsTab | null) ?? 'profile';
  const [message, setMessage] = useState<string | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKeyView[]>([]);
  const [linkedAccounts, setLinkedAccounts] = useState<LinkedAccountView[]>([]);
  const [loading, setLoading] = useState(false);
  const [createKeyOpen, setCreateKeyOpen] = useState(false);
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [newKeyName, setNewKeyName] = useState('');
  const [acknowledged, setAcknowledged] = useState(false);
  const [locale, setLocale] = useState('en-DE');
  const [currency, setCurrency] = useState('EUR');
  const [theme, setTheme] = useState('system');
  const [importPreview, setImportPreview] = useState<ImportPreviewRow[]>([]);
  const [importing, setImporting] = useState(false);
  const csvInputRef = useRef<HTMLInputElement>(null);

  const loadSecurityData = async () => {
    setLoading(true);
    if (tab === 'sessions') {
      const [sessionResult, accountResult] = await Promise.all([authClient.listSessions(), authClient.listAccounts()]);
      if (sessionResult.error) setMessage(sessionResult.error.message ?? 'Sessions could not be loaded.');
      else setSessions(sessionResult.data ?? []);
      if (accountResult.error) setMessage(accountResult.error.message ?? 'Linked accounts could not be loaded.');
      else
        setLinkedAccounts(
          (accountResult.data ?? []).map(account => ({
            id: account.id,
            accountId: account.accountId,
            providerId: account.providerId,
            createdAt: new Date(account.createdAt),
          })),
        );
    }
    if (tab === 'api-keys') {
      const {data, error} = await authClient.apiKey.list({
        query: {limit: 50, offset: 0, sortBy: 'createdAt', sortDirection: 'desc'},
      });
      if (error) setMessage(error.message ?? 'API keys could not be loaded.');
      else
        setApiKeys(
          (data?.apiKeys ?? []).map(key => ({
            id: key.id,
            name: key.name,
            start: key.start,
            createdAt: new Date(key.createdAt),
            expiresAt: key.expiresAt ? new Date(key.expiresAt) : null,
          })),
        );
    }
    setLoading(false);
  };
  useEffect(() => {
    if (tab !== 'profile') void loadSecurityData();
  }, [tab]);
  useEffect(() => {
    setLocale(localStorage.getItem('budgetbuddy-locale') ?? 'en-DE');
    setCurrency(localStorage.getItem('budgetbuddy-currency') ?? 'EUR');
    setTheme(localStorage.getItem('budgetbuddy-theme') ?? 'system');
  }, []);

  const selectTab = (next: SettingsTab) => router.replace(`?tab=${next}`, {scroll: false});
  const updateProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    const form = new FormData(event.currentTarget);
    const name = String(form.get('name') ?? '').trim();
    const email = String(form.get('email') ?? '').trim();
    if (!name || !email) {
      setMessage('Name and email are required.');
      return;
    }
    if (name !== session?.user.name) {
      const {error} = await authClient.updateUser({name});
      if (error) {
        setMessage(error.message ?? 'Name could not be updated.');
        return;
      }
    }
    if (email !== session?.user.email) {
      const {error} = await authClient.changeEmail({
        newEmail: email,
        callbackURL: `${window.location.origin}/email/changed`,
      });
      if (error) {
        setMessage(error.message ?? 'Email change could not be started.');
        return;
      }
    }
    await refetchSession();
    setMessage('Profile changes saved.');
  };
  const revoke = async (token: string) => {
    const {error} = await authClient.revokeSession({token});
    setMessage(error?.message ?? 'Session revoked.');
    if (!error) await loadSecurityData();
  };
  const unlinkAccount = async (providerId: string, accountId: string) => {
    const {error} = await authClient.unlinkAccount({providerId, accountId});
    setMessage(error?.message ?? 'Linked account removed.');
    if (!error) await loadSecurityData();
  };
  const resendVerification = async () => {
    if (!session?.user.email) return;
    const {error} = await authClient.sendVerificationEmail({
      email: session.user.email,
      callbackURL: `${window.location.origin}/email/verified`,
    });
    setMessage(error?.message ?? 'Verification email sent.');
  };
  const createKey = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newKeyName.trim()) {
      setMessage('Enter a name for this API key.');
      return;
    }
    const {data, error} = await authClient.apiKey.create({name: newKeyName.trim()});
    if (error || !data?.key) {
      setMessage(error?.message ?? 'API key could not be created.');
      return;
    }
    setCreatedKey(data.key);
    setCreateKeyOpen(false);
    setAcknowledged(false);
    await loadSecurityData();
  };
  const deleteKey = async (keyId: string) => {
    const {error} = await authClient.apiKey.delete({keyId});
    setMessage(error?.message ?? 'API key deleted.');
    if (!error) await loadSecurityData();
  };
  const savePreferences = () => {
    localStorage.setItem('budgetbuddy-locale', locale);
    localStorage.setItem('budgetbuddy-currency', currency);
    localStorage.setItem('budgetbuddy-theme', theme);
    const resolvedTheme =
      theme === 'system' ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : theme;
    document.documentElement.dataset.theme = resolvedTheme;
    document.documentElement.lang = locale.split('-')[0] ?? 'en';
    setMessage('Preferences saved. New views use your selected locale and currency.');
  };
  const exportJson = () => {
    const content = JSON.stringify({exportedAt: new Date().toISOString(), version: 1, data: financeData}, null, 2);
    const href = URL.createObjectURL(new Blob([content], {type: 'application/json'}));
    const link = document.createElement('a');
    link.href = href;
    link.download = `budgetbuddy-export-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(href);
  };
  const previewCsv = async (file?: File) => {
    if (!file) return;
    const content = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ''));
      reader.onerror = () => reject(reader.error ?? new Error('The CSV file could not be read.'));
      reader.readAsText(file);
    });
    setImportPreview(createTransactionImportPreview(content, financeData.categories, financeData.paymentMethods));
  };
  const importValidRows = async () => {
    const validRows = importPreview.filter(row => row.input);
    setImporting(true);
    let imported = 0;
    for (const row of validRows) {
      if (row.input && (await createEntity('transactions', row.input))) imported += 1;
    }
    setImporting(false);
    setMessage(`${imported} of ${validRows.length} valid transactions imported.`);
    setImportPreview([]);
    if (csvInputRef.current) csvInputRef.current.value = '';
  };

  return (
    <div className="page-stack settings-page">
      <PageHeader
        eyebrow="Account"
        title="Settings"
        description="Manage your profile, active sessions, and developer access."
      />
      <div className="settings-layout">
        <nav className="settings-nav" aria-label="Settings sections">
          <button className={tab === 'profile' ? 'active' : ''} onClick={() => selectTab('profile')}>
            <UserRound size={17} />
            <span>
              <strong>Profile</strong>
              <small>Personal details</small>
            </span>
          </button>
          <button className={tab === 'preferences' ? 'active' : ''} onClick={() => selectTab('preferences')}>
            <Palette size={17} />
            <span>
              <strong>Preferences</strong>
              <small>Locale and theme</small>
            </span>
          </button>
          <button className={tab === 'data' ? 'active' : ''} onClick={() => selectTab('data')}>
            <Database size={17} />
            <span>
              <strong>Data</strong>
              <small>Import and export</small>
            </span>
          </button>
          <button className={tab === 'sessions' ? 'active' : ''} onClick={() => selectTab('sessions')}>
            <MonitorSmartphone size={17} />
            <span>
              <strong>Sessions</strong>
              <small>Signed-in devices</small>
            </span>
          </button>
          <button className={tab === 'api-keys' ? 'active' : ''} onClick={() => selectTab('api-keys')}>
            <KeyRound size={17} />
            <span>
              <strong>API keys</strong>
              <small>Developer access</small>
            </span>
          </button>
        </nav>
        <section className="settings-content">
          {message && (
            <div className="settings-message" role="status">
              {message}
            </div>
          )}
          {tab === 'profile' && (
            <>
              <div className="settings-heading">
                <div>
                  <h2>Personal information</h2>
                  <p>Used for your account and security notifications.</p>
                </div>
                <Avatar name={session?.user.name ?? 'User'} image={session?.user.image} size="lg" />
              </div>
              <form className="settings-form" onSubmit={event => void updateProfile(event)}>
                <TextField label="Full name" name="name" defaultValue={session?.user.name ?? ''} required />
                <TextField
                  label="Email address"
                  name="email"
                  type="email"
                  defaultValue={session?.user.email ?? ''}
                  required
                  hint={session?.user.emailVerified ? 'Verified email' : 'Email not verified'}
                />
                {!session?.user.emailVerified && (
                  <Button variant="secondary" size="sm" onClick={() => void resendVerification()}>
                    Resend verification email
                  </Button>
                )}
                <div className="form-actions">
                  <Button type="submit">Save changes</Button>
                </div>
              </form>
              <div className="danger-zone">
                <div>
                  <strong>Delete account</strong>
                  <p>Permanently remove your profile and all finance data.</p>
                </div>
                <ConfirmDialog
                  trigger={<Button variant="danger">Delete account</Button>}
                  title="Delete your BudgetBuddy account?"
                  description="All transactions, categories, budgets, attachments, and access keys will be permanently deleted."
                  confirmLabel="Delete my account"
                  onConfirm={async () => {
                    const {error} = await authClient.deleteUser({
                      callbackURL: `${window.location.origin}/user/confirm-deletion`,
                    });
                    setMessage(error?.message ?? 'Account deletion started.');
                  }}
                />
              </div>
            </>
          )}
          {tab === 'preferences' && (
            <>
              <div className="settings-heading">
                <div>
                  <h2>Display and regional preferences</h2>
                  <p>Control number, date, currency, and color presentation.</p>
                </div>
                <Palette size={22} />
              </div>
              <div className="settings-form">
                <SelectField label="Locale" value={locale} onChange={event => setLocale(event.target.value)}>
                  <option value="en-DE">English (Germany)</option>
                  <option value="en-US">English (United States)</option>
                  <option value="de-DE">Deutsch (Deutschland)</option>
                </SelectField>
                <SelectField
                  label="Default currency"
                  value={currency}
                  onChange={event => setCurrency(event.target.value)}
                >
                  <option value="EUR">Euro (EUR)</option>
                  <option value="USD">US dollar (USD)</option>
                  <option value="GBP">British pound (GBP)</option>
                  <option value="CHF">Swiss franc (CHF)</option>
                </SelectField>
                <SelectField label="Theme" value={theme} onChange={event => setTheme(event.target.value)}>
                  <option value="system">Use system setting</option>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </SelectField>
                <div className="form-actions">
                  <Button onClick={savePreferences}>Save preferences</Button>
                </div>
              </div>
            </>
          )}
          {tab === 'data' && (
            <>
              <div className="settings-heading">
                <div>
                  <h2>Import and export</h2>
                  <p>Move your data with a traceable preview before any import.</p>
                </div>
                <Button variant="secondary" onClick={exportJson}>
                  <Download size={16} /> Export JSON
                </Button>
              </div>
              <div className="data-management">
                <div className="import-instructions">
                  <span className="session-icon">
                    <UploadCloud size={19} />
                  </span>
                  <div>
                    <strong>Import transactions from CSV</strong>
                    <p>Required columns: date, amount, receiver, category, paymentMethod. Optional: note.</p>
                  </div>
                  <label className="button button-secondary button-md">
                    Choose CSV
                    <input
                      ref={csvInputRef}
                      type="file"
                      accept=".csv,text/csv"
                      onChange={event => void previewCsv(event.target.files?.[0])}
                    />
                  </label>
                </div>
                {importPreview.length > 0 && (
                  <>
                    <div className="import-summary">
                      <span>
                        <strong>{importPreview.filter(row => row.input).length}</strong> valid rows
                      </span>
                      <span>
                        <strong>{importPreview.filter(row => !row.input).length}</strong> rows need attention
                      </span>
                    </div>
                    <div className="import-table" role="table" aria-label="CSV import preview">
                      <div className="import-row header" role="row">
                        <span>Row</span>
                        <span>Receiver</span>
                        <span>Amount</span>
                        <span>Validation</span>
                      </div>
                      {importPreview.slice(0, 20).map(row => (
                        <div key={row.rowNumber} className="import-row" role="row">
                          <span>{row.rowNumber}</span>
                          <span>{row.raw.receiver || '—'}</span>
                          <span>{row.raw.amount || '—'}</span>
                          <span className={row.errors.length ? 'import-error' : 'import-valid'}>
                            {row.errors.length ? row.errors.join(', ') : 'Ready'}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="form-actions">
                      <Button variant="secondary" onClick={() => setImportPreview([])}>
                        Cancel
                      </Button>
                      <Button
                        disabled={importing || importPreview.every(row => !row.input)}
                        onClick={() => void importValidRows()}
                      >
                        {importing
                          ? 'Importing…'
                          : `Import ${importPreview.filter(row => row.input).length} valid rows`}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
          {tab === 'sessions' && (
            <>
              <div className="settings-heading">
                <div>
                  <h2>Active sessions</h2>
                  <p>Revoke access for devices you no longer use.</p>
                </div>
                <Shield size={22} />
              </div>
              {loading ? (
                <SkeletonRows count={4} />
              ) : sessions.length === 0 ? (
                <StatePanel state="empty" title="No sessions found" />
              ) : (
                <div className="session-list">
                  {sessions.map(item => (
                    <div key={item.id} className="session-item">
                      <span className="session-icon">
                        <Laptop size={19} />
                      </span>
                      <span>
                        <strong>{item.userAgent || 'Unknown browser'}</strong>
                        <small>
                          {item.ipAddress || 'Unknown IP'} · created {formatDate(item.createdAt)}
                        </small>
                      </span>
                      {item.token === session?.session.token ? (
                        <span className="current-session">
                          <Check size={14} /> Current
                        </span>
                      ) : (
                        <ConfirmDialog
                          trigger={
                            <Button size="sm" variant="secondary">
                              Revoke
                            </Button>
                          }
                          title="Revoke this session?"
                          description="The device will be signed out immediately."
                          confirmLabel="Revoke"
                          onConfirm={() => revoke(item.token)}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
              <div className="subsection-heading">
                <div>
                  <h3>Linked accounts</h3>
                  <p>OAuth providers connected to your BudgetBuddy identity.</p>
                </div>
              </div>
              {linkedAccounts.length === 0 ? (
                <p className="subsection-empty">No linked Google or GitHub accounts.</p>
              ) : (
                <div className="session-list">
                  {linkedAccounts.map(account => (
                    <div key={account.id} className="session-item">
                      <span className="session-icon">
                        <Shield size={19} />
                      </span>
                      <span>
                        <strong>{account.providerId}</strong>
                        <small>Connected {formatDate(account.createdAt)}</small>
                      </span>
                      <ConfirmDialog
                        trigger={
                          <Button size="sm" variant="secondary">
                            Unlink
                          </Button>
                        }
                        title={`Unlink ${account.providerId}?`}
                        description="You will no longer be able to sign in with this provider."
                        confirmLabel="Unlink account"
                        onConfirm={() => unlinkAccount(account.providerId, account.accountId)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
          {tab === 'api-keys' && (
            <>
              <div className="settings-heading">
                <div>
                  <h2>API keys</h2>
                  <p>Use scoped credentials for personal integrations.</p>
                </div>
                <Button onClick={() => setCreateKeyOpen(true)}>
                  <Plus size={16} /> Create key
                </Button>
              </div>
              {loading ? (
                <SkeletonRows count={4} />
              ) : apiKeys.length === 0 ? (
                <StatePanel
                  state="empty"
                  title="No API keys"
                  description="Create a key when you are ready to connect an integration."
                />
              ) : (
                <div className="session-list">
                  {apiKeys.map(key => (
                    <div key={key.id} className="session-item">
                      <span className="session-icon">
                        <KeyRound size={19} />
                      </span>
                      <span>
                        <strong>{key.name || 'Unnamed key'}</strong>
                        <small>
                          {key.start ? `${key.start}…` : 'Hidden'} · created {formatDate(key.createdAt)}
                          {key.expiresAt ? ` · expires ${formatDate(key.expiresAt)}` : ''}
                        </small>
                      </span>
                      <ConfirmDialog
                        trigger={
                          <button className="inline-delete" aria-label={`Delete ${key.name ?? 'API key'}`}>
                            <Trash2 size={16} />
                          </button>
                        }
                        title={`Delete ${key.name ?? 'API key'}?`}
                        description="Applications using this key will lose access immediately."
                        confirmLabel="Delete key"
                        onConfirm={() => deleteKey(key.id)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </section>
      </div>
      <DialogShell
        open={createKeyOpen}
        onOpenChange={setCreateKeyOpen}
        title="Create API key"
        description="Name the integration so you can recognize and revoke it later."
      >
        <form className="entity-form" onSubmit={event => void createKey(event)}>
          <TextField
            label="Key name"
            value={newKeyName}
            onChange={event => setNewKeyName(event.target.value)}
            placeholder="e.g. Home dashboard"
            autoFocus
          />
          <div className="form-actions">
            <Button variant="secondary" onClick={() => setCreateKeyOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Create key</Button>
          </div>
        </form>
      </DialogShell>
      <DialogShell
        open={Boolean(createdKey)}
        onOpenChange={open => {
          if (!open && acknowledged) setCreatedKey(null);
        }}
        title="Copy your API key now"
        description="For your security, the full key is shown only once."
      >
        <div className="created-key">
          <code>{createdKey}</code>
          <Button variant="secondary" onClick={() => createdKey && void navigator.clipboard.writeText(createdKey)}>
            <Clipboard size={16} /> Copy
          </Button>
        </div>
        <label className="acknowledge">
          <input type="checkbox" checked={acknowledged} onChange={event => setAcknowledged(event.target.checked)} /> I
          saved this key in a secure place.
        </label>
        <div className="form-actions">
          <Button disabled={!acknowledged} onClick={() => setCreatedKey(null)}>
            Done
          </Button>
        </div>
      </DialogShell>
    </div>
  );
}
