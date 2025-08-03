import { CategoryTable } from '@/components/Category/CategoryTable';
import { ErrorAlert } from '@/components/ErrorAlert';
import { ContentGrid } from '@/components/Layout/ContentGrid';
import { CategoryService } from '@/services/Category.service';
import { Grid } from '@mui/material';
import { headers } from 'next/headers';

export default async function CategoriesPage() {
  const [categories, error] = await CategoryService.getCategories(undefined, {
    headers: await headers(),
  });
  return (
    <ContentGrid title="Categories" description="Manage your categories...">
      <Grid size={{ xs: 12, md: 5 }}>
        {error ? <ErrorAlert error={error} /> : <CategoryTable categories={categories} />}
      </Grid>
    </ContentGrid>
  );
}
