import {Grid} from '@mui/material';
import {CategoryTable} from '@/components/Category/CategoryTable';
import {parseKeywordFilterFromParams} from '@/components/Filter';
import {ContentGrid} from '@/components/Layout/ContentGrid';

export default async function CategoriesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const {keyword} = parseKeywordFilterFromParams(params);

  return (
    <ContentGrid title="Categories">
      <Grid size={{xs: 12, md: 12}}>
        <CategoryTable initialKeyword={keyword ?? undefined} />
      </Grid>
    </ContentGrid>
  );
}
