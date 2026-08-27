'use client';

import {Stack, ToggleButton, ToggleButtonGroup} from '@mui/material';
import {usePathname, useRouter, useSearchParams} from 'next/navigation';
import React from 'react';
import {ActionPaper} from '@/components/ActionPaper';
import type {EntityFilters} from '@/lib/features/createEntitySlice';
import {RecurringPaymentTable} from '../RecurringPaymentTable';
import type {OccurrenceRange, RecurringPaymentView} from './occurrenceRange';
import {RecurringPaymentOccurrenceTable} from './RecurringPaymentOccurrenceTable';

export type RecurringPaymentsViewProps = {
  initialFilters: Partial<EntityFilters>;
  initialRange: OccurrenceRange;
};

export const RecurringPaymentsView: React.FC<RecurringPaymentsViewProps> = ({initialFilters, initialRange}) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [view, setView] = React.useState<RecurringPaymentView>(initialRange.view);

  const changeView = (nextView: RecurringPaymentView) => {
    setView(nextView);
    const params = new URLSearchParams(searchParams.toString());
    if (nextView === 'occurrences') {
      ['q', 'paused', 'cat', 'excl_cat', 'pm', 'excl_pm'].forEach(parameter => params.delete(parameter));
      params.set('view', 'occurrences');
      if (!params.has('dateFrom')) params.set('dateFrom', initialRange.dateFrom);
      if (!params.has('dateTo')) params.set('dateTo', initialRange.dateTo);
    } else {
      ['view', 'dateFrom', 'dateTo', 'includePaused'].forEach(parameter => params.delete(parameter));
    }
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  };

  return (
    <Stack gap={2} sx={{minWidth: 0}}>
      <ActionPaper
        sx={{
          width: 'min-content',
          maxWidth: '100%',
          overflowX: 'scroll',
          '::-webkit-scrollbar': {
            display: 'none',
          },
          msOverflowStyle: 'none',
          scrollbarWidth: 'none',
        }}
      >
        <ToggleButtonGroup
          value={view}
          exclusive
          size="small"
          color="primary"
          onChange={(_, nextView: RecurringPaymentView | null) => nextView && changeView(nextView)}
          aria-label="Recurring payment view"
          sx={{alignSelf: {xs: 'stretch', sm: 'flex-start'}, '& .MuiToggleButton-root': {flex: {xs: 1, sm: 'none'}}}}
        >
          <ToggleButton value="schedules">Schedules</ToggleButton>
          <ToggleButton value="occurrences">Occurrences</ToggleButton>
        </ToggleButtonGroup>
      </ActionPaper>
      {view === 'schedules' ? (
        <RecurringPaymentTable initialFilters={initialFilters} />
      ) : (
        <RecurringPaymentOccurrenceTable initialRange={initialRange} />
      )}
    </Stack>
  );
};
