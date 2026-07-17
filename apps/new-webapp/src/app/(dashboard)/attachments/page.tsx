import type {Metadata} from 'next';
import {AttachmentWorkspace} from '@/components/attachments/attachment-workspace';
import {PageShell} from '@/components/page-shell';
import {loadAttachmentPage} from '@/lib/data/attachments';
import {requireSession} from '@/serverAuth';
import {parseListQuery} from '@/utils/pagination-query';

export const metadata: Metadata = {title: 'Attachments'};

export default async function AttachmentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [params] = await Promise.all([searchParams, requireSession()]);
  const query = parseListQuery(params);
  const data = await loadAttachmentPage(query.page, query.pageSize);
  return (
    <PageShell title="Attachments" description="Browse and securely manage receipt images.">
      <AttachmentWorkspace
        initialAttachments={data.attachments}
        totalCount={data.totalCount}
        page={query.page}
        pageSize={query.pageSize}
        error={data.error}
      />
    </PageShell>
  );
}
