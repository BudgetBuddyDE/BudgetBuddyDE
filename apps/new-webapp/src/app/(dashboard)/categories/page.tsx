import type {Metadata} from 'next';
import {CategoryWorkspace} from '@/components/categories/category-workspace';
import {PageShell} from '@/components/page-shell';
import {loadCategoryPage} from '@/lib/data/categories';
import {requireSession} from '@/serverAuth';
import {parseListQuery} from '@/utils/pagination-query';

export const metadata: Metadata = {title: 'Categories'};

export default async function CategoriesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [params] = await Promise.all([searchParams, requireSession()]);
  const query = parseListQuery(params);
  const data = await loadCategoryPage(query.search, query.page, query.pageSize);
  return (
    <PageShell title="Categories" description="Organize transaction classifications and monthly targets.">
      <CategoryWorkspace
        initialCategories={data.categories}
        totalCount={data.totalCount}
        search={query.search}
        page={query.page}
        pageSize={query.pageSize}
        initialCreate={params.intent === 'create'}
        intentObject={params.intent === 'edit' && typeof params.object === 'string' ? params.object : undefined}
        error={data.error}
      />
    </PageShell>
  );
}
