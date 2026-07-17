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
import {PageHeader, SkeletonRows, StatePanel} from '@/components/shared';
import {Button, ConfirmDialog, DialogShell, SelectField, TextField} from '@/components/ui/primitives';
import {useFinance} from '@/lib/finance-provider';
import {type AppCurrency, type AppLocale, useI18n} from '@/lib/i18n';
import {useTheme} from '@/theme/theme-provider';
import {createTransactionImportPreview, type ImportPreviewRow} from '@/utils/csv';

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
  const {t, locale, currency, setLocale, setCurrency, formatDate} = useI18n();
  const {mode: theme, setMode: setTheme} = useTheme();
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
  const [importPreview, setImportPreview] = useState<ImportPreviewRow[]>([]);
  const [importing, setImporting] = useState(false);
  const csvInputRef = useRef<HTMLInputElement>(null);

  const loadSecurityData = async () => {
    setLoading(true);
    if (tab === 'sessions') {
      const [sessionResult, accountResult] = await Promise.all([authClient.listSessions(), authClient.listAccounts()]);
      if (sessionResult.error) setMessage(sessionResult.error.message ?? t('settings.error.sessions'));
      else setSessions(sessionResult.data ?? []);
      if (accountResult.error) setMessage(accountResult.error.message ?? t('settings.error.accounts'));
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
      if (error) setMessage(error.message ?? t('settings.error.apiKeys'));
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

  const selectTab = (next: SettingsTab) => router.replace(`?tab=${next}`, {scroll: false});
  const updateProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    const form = new FormData(event.currentTarget);
    const name = String(form.get('name') ?? '').trim();
    const email = String(form.get('email') ?? '').trim();
    if (!name || !email) {
      setMessage(t('settings.error.nameEmailRequired'));
      return;
    }
    if (name !== session?.user.name) {
      const {error} = await authClient.updateUser({name});
      if (error) {
        setMessage(error.message ?? t('settings.error.nameUpdate'));
        return;
      }
    }
    if (email !== session?.user.email) {
      const {error} = await authClient.changeEmail({
        newEmail: email,
        callbackURL: `${window.location.origin}/email/changed`,
      });
      if (error) {
        setMessage(error.message ?? t('settings.error.emailChange'));
        return;
      }
    }
    await refetchSession();
    setMessage(t('settings.profileSaved'));
  };
  const revoke = async (token: string) => {
    const {error} = await authClient.revokeSession({token});
    setMessage(error?.message ?? t('settings.sessionRevoked'));
    if (!error) await loadSecurityData();
  };
  const unlinkAccount = async (providerId: string, accountId: string) => {
    const {error} = await authClient.unlinkAccount({providerId, accountId});
    setMessage(error?.message ?? t('settings.accountUnlinked'));
    if (!error) await loadSecurityData();
  };
  const resendVerification = async () => {
    if (!session?.user.email) return;
    const {error} = await authClient.sendVerificationEmail({
      email: session.user.email,
      callbackURL: `${window.location.origin}/email/verified`,
    });
    setMessage(error?.message ?? t('settings.verificationSent'));
  };
  const createKey = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newKeyName.trim()) {
      setMessage(t('settings.error.keyName'));
      return;
    }
    const {data, error} = await authClient.apiKey.create({name: newKeyName.trim()});
    if (error || !data?.key) {
      setMessage(error?.message ?? t('settings.error.keyCreate'));
      return;
    }
    setCreatedKey(data.key);
    setCreateKeyOpen(false);
    setAcknowledged(false);
    await loadSecurityData();
  };
  const deleteKey = async (keyId: string) => {
    const {error} = await authClient.apiKey.delete({keyId});
    setMessage(error?.message ?? t('settings.keyDeleted'));
    if (!error) await loadSecurityData();
  };
  const savePreferences = () => {
    setMessage(t('settings.preferencesSaved'));
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
      reader.onerror = () => reject(reader.error ?? new Error(t('settings.error.csvRead')));
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
    setMessage(t('settings.imported', {imported, count: validRows.length}));
    setImportPreview([]);
    if (csvInputRef.current) csvInputRef.current.value = '';
  };

  return (
    <div className="page-stack settings-page">
      <PageHeader eyebrow={t('settings.account')} title={t('settings.title')} description={t('settings.description')} />
      <div className="settings-layout">
        <nav className="settings-nav" aria-label={t('settings.sections')}>
          <button className={tab === 'profile' ? 'active' : ''} onClick={() => selectTab('profile')}>
            <UserRound size={17} />
            <span>
              <strong>{t('settings.profile')}</strong>
              <small>{t('settings.personalDetails')}</small>
            </span>
          </button>
          <button className={tab === 'preferences' ? 'active' : ''} onClick={() => selectTab('preferences')}>
            <Palette size={17} />
            <span>
              <strong>{t('settings.preferences')}</strong>
              <small>{t('settings.localeTheme')}</small>
            </span>
          </button>
          <button className={tab === 'data' ? 'active' : ''} onClick={() => selectTab('data')}>
            <Database size={17} />
            <span>
              <strong>{t('settings.data')}</strong>
              <small>{t('settings.importExport')}</small>
            </span>
          </button>
          <button className={tab === 'sessions' ? 'active' : ''} onClick={() => selectTab('sessions')}>
            <MonitorSmartphone size={17} />
            <span>
              <strong>{t('settings.sessions')}</strong>
              <small>{t('settings.signedInDevices')}</small>
            </span>
          </button>
          <button className={tab === 'api-keys' ? 'active' : ''} onClick={() => selectTab('api-keys')}>
            <KeyRound size={17} />
            <span>
              <strong>{t('settings.apiKeys')}</strong>
              <small>{t('settings.developerAccess')}</small>
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
                  <h2>{t('settings.personalInformation')}</h2>
                  <p>{t('settings.personalInformationDescription')}</p>
                </div>
                <span className="profile-avatar">{session?.user.name?.slice(0, 1).toLocaleUpperCase() ?? 'U'}</span>
              </div>
              <form className="settings-form" onSubmit={event => void updateProfile(event)}>
                <TextField
                  label={t('settings.fullName')}
                  name="name"
                  defaultValue={session?.user.name ?? ''}
                  required
                />
                <TextField
                  label={t('auth.email')}
                  name="email"
                  type="email"
                  defaultValue={session?.user.email ?? ''}
                  required
                  hint={session?.user.emailVerified ? t('settings.verifiedEmail') : t('settings.emailNotVerified')}
                />
                {!session?.user.emailVerified && (
                  <Button variant="secondary" size="sm" onClick={() => void resendVerification()}>
                    {t('settings.resendVerification')}
                  </Button>
                )}
                <div className="form-actions">
                  <Button type="submit">{t('settings.saveChanges')}</Button>
                </div>
              </form>
              <div className="danger-zone">
                <div>
                  <strong>{t('settings.deleteAccount')}</strong>
                  <p>{t('settings.deleteAccountDescription')}</p>
                </div>
                <ConfirmDialog
                  trigger={<Button variant="danger">{t('settings.deleteAccount')}</Button>}
                  title={t('settings.deleteAccountTitle')}
                  description={t('settings.deleteAccountConfirmDescription')}
                  confirmLabel={t('settings.deleteMyAccount')}
                  onConfirm={async () => {
                    const {error} = await authClient.deleteUser({
                      callbackURL: `${window.location.origin}/user/confirm-deletion`,
                    });
                    setMessage(error?.message ?? t('settings.accountDeletionStarted'));
                  }}
                />
              </div>
            </>
          )}
          {tab === 'preferences' && (
            <>
              <div className="settings-heading">
                <div>
                  <h2>{t('settings.displayPreferences')}</h2>
                  <p>{t('settings.displayPreferencesDescription')}</p>
                </div>
                <Palette size={22} />
              </div>
              <div className="settings-form">
                <SelectField
                  label={t('settings.locale')}
                  value={locale}
                  onChange={event => setLocale(event.target.value as AppLocale)}
                >
                  <option value="en-DE">{t('settings.locale.enDE')}</option>
                  <option value="en-US">{t('settings.locale.enUS')}</option>
                  <option value="de-DE">{t('settings.locale.deDE')}</option>
                </SelectField>
                <SelectField
                  label={t('settings.defaultCurrency')}
                  value={currency}
                  onChange={event => setCurrency(event.target.value as AppCurrency)}
                >
                  <option value="EUR">{t('settings.currency.eur')}</option>
                  <option value="USD">{t('settings.currency.usd')}</option>
                  <option value="GBP">{t('settings.currency.gbp')}</option>
                  <option value="CHF">{t('settings.currency.chf')}</option>
                </SelectField>
                <SelectField
                  label={t('settings.theme')}
                  value={theme}
                  onChange={event => setTheme(event.target.value as 'light' | 'dark')}
                >
                  <option value="light">{t('theme.useLight')}</option>
                  <option value="dark">{t('theme.useDark')}</option>
                </SelectField>
                <div className="form-actions">
                  <Button onClick={savePreferences}>{t('settings.savePreferences')}</Button>
                </div>
              </div>
            </>
          )}
          {tab === 'data' && (
            <>
              <div className="settings-heading">
                <div>
                  <h2>{t('settings.importExport')}</h2>
                  <p>{t('settings.importExportDescription')}</p>
                </div>
                <Button variant="secondary" onClick={exportJson}>
                  <Download size={16} /> {t('common.exportJson')}
                </Button>
              </div>
              <div className="data-management">
                <div className="import-instructions">
                  <span className="session-icon">
                    <UploadCloud size={19} />
                  </span>
                  <div>
                    <strong>{t('settings.importCsv')}</strong>
                    <p>{t('settings.importCsvDescription')}</p>
                  </div>
                  <label className="button button-secondary button-md">
                    {t('settings.chooseCsv')}
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
                        <strong>{importPreview.filter(row => row.input).length}</strong> {t('settings.validRows')}
                      </span>
                      <span>
                        <strong>{importPreview.filter(row => !row.input).length}</strong>{' '}
                        {t('settings.rowsNeedAttention')}
                      </span>
                    </div>
                    <div className="import-table" role="table" aria-label={t('settings.csvPreview')}>
                      <div className="import-row header" role="row">
                        <span>{t('settings.row')}</span>
                        <span>{t('common.receiver')}</span>
                        <span>{t('common.amount')}</span>
                        <span>{t('settings.validation')}</span>
                      </div>
                      {importPreview.slice(0, 20).map(row => (
                        <div key={row.rowNumber} className="import-row" role="row">
                          <span>{row.rowNumber}</span>
                          <span>{row.raw.receiver || '—'}</span>
                          <span>{row.raw.amount || '—'}</span>
                          <span className={row.errors.length ? 'import-error' : 'import-valid'}>
                            {row.errors.length
                              ? row.errors.map(errorKey => t(errorKey)).join(', ')
                              : t('attachment.status.ready')}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="form-actions">
                      <Button variant="secondary" onClick={() => setImportPreview([])}>
                        {t('common.cancel')}
                      </Button>
                      <Button
                        disabled={importing || importPreview.every(row => !row.input)}
                        onClick={() => void importValidRows()}
                      >
                        {importing
                          ? t('settings.importing')
                          : t('settings.importValidRows', {count: importPreview.filter(row => row.input).length})}
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
                  <h2>{t('settings.activeSessions')}</h2>
                  <p>{t('settings.activeSessionsDescription')}</p>
                </div>
                <Shield size={22} />
              </div>
              {loading ? (
                <SkeletonRows count={4} />
              ) : sessions.length === 0 ? (
                <StatePanel state="empty" title={t('settings.noSessions')} />
              ) : (
                <div className="session-list">
                  {sessions.map(item => (
                    <div key={item.id} className="session-item">
                      <span className="session-icon">
                        <Laptop size={19} />
                      </span>
                      <span>
                        <strong>{item.userAgent || t('settings.unknownBrowser')}</strong>
                        <small>
                          {t('settings.sessionCreated', {
                            ip: item.ipAddress || t('settings.unknownIp'),
                            date: formatDate(item.createdAt),
                          })}
                        </small>
                      </span>
                      {item.token === session?.session.token ? (
                        <span className="current-session">
                          <Check size={14} /> {t('settings.current')}
                        </span>
                      ) : (
                        <ConfirmDialog
                          trigger={
                            <Button size="sm" variant="secondary">
                              {t('settings.revoke')}
                            </Button>
                          }
                          title={t('settings.revokeTitle')}
                          description={t('settings.revokeDescription')}
                          confirmLabel={t('settings.revoke')}
                          onConfirm={() => revoke(item.token)}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
              <div className="subsection-heading">
                <div>
                  <h3>{t('settings.linkedAccounts')}</h3>
                  <p>{t('settings.linkedAccountsDescription')}</p>
                </div>
              </div>
              {linkedAccounts.length === 0 ? (
                <p className="subsection-empty">{t('settings.noLinkedAccounts')}</p>
              ) : (
                <div className="session-list">
                  {linkedAccounts.map(account => (
                    <div key={account.id} className="session-item">
                      <span className="session-icon">
                        <Shield size={19} />
                      </span>
                      <span>
                        <strong>{account.providerId}</strong>
                        <small>{t('settings.connected', {date: formatDate(account.createdAt)})}</small>
                      </span>
                      <ConfirmDialog
                        trigger={
                          <Button size="sm" variant="secondary">
                            {t('settings.unlink')}
                          </Button>
                        }
                        title={t('settings.unlinkTitle', {provider: account.providerId})}
                        description={t('settings.unlinkDescription')}
                        confirmLabel={t('settings.unlinkAccount')}
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
                  <h2>{t('settings.apiKeys')}</h2>
                  <p>{t('settings.apiKeysDescription')}</p>
                </div>
                <Button onClick={() => setCreateKeyOpen(true)}>
                  <Plus size={16} /> {t('settings.createKey')}
                </Button>
              </div>
              {loading ? (
                <SkeletonRows count={4} />
              ) : apiKeys.length === 0 ? (
                <StatePanel
                  state="empty"
                  title={t('settings.noApiKeys')}
                  description={t('settings.noApiKeysDescription')}
                />
              ) : (
                <div className="session-list">
                  {apiKeys.map(key => (
                    <div key={key.id} className="session-item">
                      <span className="session-icon">
                        <KeyRound size={19} />
                      </span>
                      <span>
                        <strong>{key.name || t('settings.unnamedKey')}</strong>
                        <small>
                          {t('settings.keyCreated', {
                            prefix: key.start ? `${key.start}…` : t('settings.hidden'),
                            date: formatDate(key.createdAt),
                          })}
                          {key.expiresAt ? ` · ${t('settings.expires', {date: formatDate(key.expiresAt)})}` : ''}
                        </small>
                      </span>
                      <ConfirmDialog
                        trigger={
                          <button
                            className="inline-delete"
                            aria-label={t('settings.deleteKeyNamed', {name: key.name ?? t('settings.apiKey')})}
                          >
                            <Trash2 size={16} />
                          </button>
                        }
                        title={t('settings.deleteKeyTitle', {name: key.name ?? t('settings.apiKey')})}
                        description={t('settings.deleteKeyDescription')}
                        confirmLabel={t('settings.deleteKey')}
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
        title={t('settings.createApiKey')}
        description={t('settings.createApiKeyDescription')}
      >
        <form className="entity-form" onSubmit={event => void createKey(event)}>
          <TextField
            label={t('settings.keyName')}
            value={newKeyName}
            onChange={event => setNewKeyName(event.target.value)}
            placeholder={t('settings.keyNamePlaceholder')}
            autoFocus
          />
          <div className="form-actions">
            <Button variant="secondary" onClick={() => setCreateKeyOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit">{t('settings.createKey')}</Button>
          </div>
        </form>
      </DialogShell>
      <DialogShell
        open={Boolean(createdKey)}
        onOpenChange={open => {
          if (!open && acknowledged) setCreatedKey(null);
        }}
        title={t('settings.copyKeyTitle')}
        description={t('settings.copyKeyDescription')}
      >
        <div className="created-key">
          <code>{createdKey}</code>
          <Button variant="secondary" onClick={() => createdKey && void navigator.clipboard.writeText(createdKey)}>
            <Clipboard size={16} /> {t('settings.copy')}
          </Button>
        </div>
        <label className="acknowledge">
          <input type="checkbox" checked={acknowledged} onChange={event => setAcknowledged(event.target.checked)} />{' '}
          {t('settings.keyAcknowledgement')}
        </label>
        <div className="form-actions">
          <Button disabled={!acknowledged} onClick={() => setCreatedKey(null)}>
            {t('attachment.done')}
          </Button>
        </div>
      </DialogShell>
    </div>
  );
}
