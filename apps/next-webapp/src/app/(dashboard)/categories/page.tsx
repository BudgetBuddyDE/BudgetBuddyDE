import { CategoryTable } from '@/components/Category/CategoryTable';
import { ContentGrid } from '@/components/Layout/ContentGrid';
import { Grid } from '@mui/material';

export default async function CategoriesPage() {
  return (
    <ContentGrid title="Categories">
      <Grid size={{ xs: 12, md: 5 }}>
        <CategoryTable />
      </Grid>
    </ContentGrid>
  );
}
