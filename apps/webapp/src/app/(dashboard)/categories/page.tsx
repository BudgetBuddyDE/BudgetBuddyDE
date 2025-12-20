import {Grid} from '@mui/material';
import {CategoryTable} from '@/components/Category/CategoryTable';
import {ContentGrid} from '@/components/Layout/ContentGrid';

export default async function CategoriesPage() {
  return (
    <ContentGrid title="Categories">
      <Grid size={{xs: 12, md: 12}}>
        <CategoryTable />
      </Grid>
    </ContentGrid>
  );
}
