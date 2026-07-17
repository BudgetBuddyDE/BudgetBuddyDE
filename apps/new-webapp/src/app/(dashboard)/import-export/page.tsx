import type {Metadata} from 'next';
import {ImportExportWorkspace} from '@/components/import-export/import-export-workspace';
import {PageShell} from '@/components/page-shell';
import {loadImportReferences} from '@/lib/data/import-export';
import {requireSession} from '@/serverAuth';

export const metadata: Metadata = {title: 'Import & export'};

export default async function ImportExportPage() {
  await requireSession();
  const data = await loadImportReferences();
  return (
    <PageShell title="Import & export" description="Move transaction data through reviewed, private workflows.">
      <ImportExportWorkspace categories={data.categories} paymentMethods={data.paymentMethods} error={data.error} />
    </PageShell>
  );
}
