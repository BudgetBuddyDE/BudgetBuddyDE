'use client';

import {ToggleButton, ToggleButtonGroup} from '@mui/material';
import {useRouter} from 'next/navigation';
import React from 'react';
import {ActionPaper} from '@/components/ActionPaper';
import {useAppTranslations} from '@/hooks/useAppTranslations';

export type RecurringPaymentView = 'schedules' | 'occurrences';

export const RecurringPaymentsNav: React.FC<{view: RecurringPaymentView}> = ({view}) => {
  const t = useAppTranslations();
  const router = useRouter();

  return (
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
        onChange={(_, nextView: RecurringPaymentView | null) => {
          if (!nextView) return;
          router.push(nextView === 'occurrences' ? '/recurringPayments/occurrences' : '/recurringPayments');
        }}
        aria-label={t('recurringPayments.recurringPaymentView')}
        sx={{alignSelf: {xs: 'stretch', sm: 'flex-start'}, '& .MuiToggleButton-root': {flex: {xs: 1, sm: 'none'}}}}
      >
        <ToggleButton value="schedules">{t('recurringPayments.schedules')}</ToggleButton>
        <ToggleButton value="occurrences">{t('recurringPayments.occurrences')}</ToggleButton>
      </ToggleButtonGroup>
    </ActionPaper>
  );
};
