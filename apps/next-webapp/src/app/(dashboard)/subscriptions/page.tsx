'use client';

import { ContentGrid } from '@/components/Layout/ContentGrid';
import { SubscriptionTable } from '@/components/Subscription/SubscriptionTable';
import { Grid } from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { TextField, Autocomplete, Button, Box } from '@mui/material';
import React from 'react';

export default function SubscriptionsPage() {
  return (
    <ContentGrid title="Subscriptions">
      <Grid size={{ xs: 12 }}>
        <MyForm />
      </Grid>
      <Grid size="grow">
        <SubscriptionTable />
      </Grid>
    </ContentGrid>
  );
}

// Beispieloptionen
const options = [
  { id: '1', name: 'Option A', description: 'Beschreibung A' },
  { id: '2', name: 'Option B', description: 'Beschreibung B' },
  { id: '3', name: 'Option C', description: 'Beschreibung C' },
];

function MyForm() {
  const [data, setData] = React.useState(null);
  const { handleSubmit, control } = useForm();

  const onSubmit = (data) => {
    console.log('Form values:', data);
    setData(data);
  };

  return (
    <React.Fragment>
      <strong>Form Data: {JSON.stringify(data)}</strong>
      <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ p: 2 }}>
        <Controller
          name="myOption"
          control={control}
          render={({ field }) => (
            <Autocomplete
              {...field}
              options={options}
              getOptionLabel={(option) => option?.name || ''}
              // isOptionEqualToValue={(option, value) => option.id === value.id}
              onChange={(_, value) => field.onChange(value)}
              renderOption={(props, option) => (
                <li {...props} key={option.id}>
                  <Box>
                    <strong>{option.name}</strong>
                    <br />
                    <small>{option.description}</small>
                  </Box>
                </li>
              )}
              renderInput={(params) => (
                <TextField {...params} label="Wähle eine Option" variant="outlined" />
              )}
            />
          )}
        />

        <Button type="submit" variant="contained" sx={{ mt: 2 }}>
          Absenden
        </Button>
      </Box>
    </React.Fragment>
  );
}
