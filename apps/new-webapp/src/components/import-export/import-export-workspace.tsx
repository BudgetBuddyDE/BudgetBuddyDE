'use client';

import type {TCategoryVH} from '@budgetbuddyde/api/category';
import type {TPaymentMethodVH} from '@budgetbuddyde/api/paymentMethod';
import {Download, Upload} from 'lucide-react';
import {useState} from 'react';
import {Button, buttonVariants} from '@/components/ui/button';
import {type CsvDocument, type CsvMapping, mapCsvRows, parseCsv} from '@/lib/csv-import';
import {saveTransactions} from '@/lib/transaction-mutations';

const emptyMapping: CsvMapping = {date: '', amount: '', receiver: '', information: '', type: ''};

export function ImportExportWorkspace({
  categories,
  paymentMethods,
  error,
}: {
  categories: TCategoryVH[];
  paymentMethods: TPaymentMethodVH[];
  error?: string;
}) {
  const [document, setDocument] = useState<CsvDocument>();
  const [mapping, setMapping] = useState<CsvMapping>(emptyMapping);
  const [categoryId, setCategoryId] = useState('');
  const [paymentMethodId, setPaymentMethodId] = useState('');
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState<{kind: 'error' | 'success'; message: string}>();
  const preview = document ? mapCsvRows(document, mapping, {categoryId, paymentMethodId}) : [];
  const valid = preview.filter(row => row.draft);
  const readFile = async (file?: File) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setStatus({kind: 'error', message: 'CSV files must be 5 MB or smaller.'});
      return;
    }
    const parsed = parseCsv(await file.text());
    if (!parsed.headers.length || !parsed.rows.length) {
      setStatus({kind: 'error', message: 'The CSV file has no data rows.'});
      return;
    }
    const match = (names: string[]) => parsed.headers.find(header => names.includes(header.toLocaleLowerCase())) ?? '';
    setDocument(parsed);
    setMapping({
      date: match(['date', 'datum', 'processedat']),
      amount: match(['amount', 'betrag', 'value']),
      receiver: match(['receiver', 'payee', 'empfänger', 'description']),
      information: match(['information', 'note', 'memo']),
      type: match(['type', 'direction', 'typ']),
    });
    setStatus(undefined);
  };
  const runImport = async () => {
    const drafts = valid.flatMap(row => (row.draft ? [row.draft] : []));
    if (!drafts.length) {
      setStatus({kind: 'error', message: 'No valid rows are ready to import.'});
      return;
    }
    setPending(true);
    const result = await saveTransactions(drafts, categories);
    setPending(false);
    setStatus({
      kind: result.failed ? 'error' : 'success',
      message: `${result.saved} imported · ${result.failed + (preview.length - valid.length)} failed or skipped.`,
    });
  };
  const columnSelect = (label: string, key: keyof CsvMapping, required = false) => (
    <label className="space-y-1 text-sm font-medium">
      {label}
      {required ? ' *' : ''}
      <select
        aria-label={`${label} column`}
        className="block h-9 w-full rounded-md border bg-background px-2"
        value={mapping[key] ?? ''}
        onChange={event => setMapping(current => ({...current, [key]: event.target.value}))}
      >
        <option value="">Not mapped</option>
        {document?.headers.map(header => (
          <option key={header} value={header}>
            {header}
          </option>
        ))}
      </select>
    </label>
  );
  return (
    <div className="space-y-6">
      {error ? (
        <p role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <section className="rounded-xl border bg-card p-5">
        <h2 className="font-semibold">Export user data</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Download transactions, categories, payment methods, budgets, and recurring payments as a private JSON archive.
        </p>
        <a className={`${buttonVariants({variant: 'outline'})} mt-4`} href="/api/export/user-data">
          <Download aria-hidden="true" className="size-4" />
          Download JSON
        </a>
      </section>
      <section className="rounded-xl border bg-card p-5">
        <h2 className="font-semibold">Import transactions from CSV</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload, confirm column mapping, review every row, then import valid rows only.
        </p>
        <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium">
          <Upload aria-hidden="true" className="size-4" />
          Choose CSV
          <input
            aria-label="CSV file"
            className="sr-only"
            type="file"
            accept=".csv,text/csv"
            onChange={event => void readFile(event.target.files?.[0])}
          />
        </label>
        {document ? (
          <div className="mt-5 space-y-5">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {columnSelect('Date', 'date', true)}
              {columnSelect('Amount', 'amount', true)}
              {columnSelect('Receiver', 'receiver', true)}
              {columnSelect('Information', 'information')}
              {columnSelect('Type', 'type')}
              <label className="space-y-1 text-sm font-medium">
                Category *
                <select
                  aria-label="Import category"
                  className="block h-9 w-full rounded-md border bg-background px-2"
                  value={categoryId}
                  onChange={event => setCategoryId(event.target.value)}
                >
                  <option value="">Select category</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1 text-sm font-medium">
                Payment method *
                <select
                  aria-label="Import payment method"
                  className="block h-9 w-full rounded-md border bg-background px-2"
                  value={paymentMethodId}
                  onChange={event => setPaymentMethodId(event.target.value)}
                >
                  <option value="">Select payment method</option>
                  {paymentMethods.map(method => (
                    <option key={method.id} value={method.id}>
                      {method.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full text-sm">
                <caption className="p-3 text-left font-medium">
                  Import preview · {valid.length} valid of {preview.length}
                </caption>
                <thead className="bg-muted">
                  <tr>
                    <th className="px-3 py-2 text-left">Row</th>
                    <th className="px-3 py-2 text-left">Receiver</th>
                    <th className="px-3 py-2 text-left">Date</th>
                    <th className="px-3 py-2 text-left">Amount</th>
                    <th className="px-3 py-2 text-left">Validation</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.slice(0, 100).map(row => (
                    <tr key={row.row} className="border-t">
                      <td className="px-3 py-2">{row.row}</td>
                      <td className="px-3 py-2">{row.draft?.receiver ?? '—'}</td>
                      <td className="px-3 py-2">{row.draft?.date ?? '—'}</td>
                      <td className="px-3 py-2">{row.draft?.amount ?? '—'}</td>
                      <td className={row.errors.length ? 'px-3 py-2 text-destructive' : 'px-3 py-2 text-success'}>
                        {row.errors.join(', ') || 'Ready'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Button onClick={runImport} disabled={pending || !valid.length}>
              {pending ? 'Importing…' : `Import ${valid.length} valid rows`}
            </Button>
          </div>
        ) : null}
      </section>
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
    </div>
  );
}
