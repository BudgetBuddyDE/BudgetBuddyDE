'use client';

import type {TCategoryVH} from '@budgetbuddyde/api/category';
import type {IGetInsightsReportQuery} from '@budgetbuddyde/api/interfaces';
import type {TPaymentMethodVH} from '@budgetbuddyde/api/paymentMethod';
import {Autocomplete, FormControl, Grid, InputLabel, MenuItem, Select, Stack, TextField} from '@mui/material';
import React from 'react';
import {Card} from '@/components/Card';
import {DateRangePicker} from '@/components/Form/DateRangePicker';
import {useAppTranslations} from '@/hooks/useAppTranslations';

type Granularity = NonNullable<IGetInsightsReportQuery['$granularity']>;
type Comparison = NonNullable<IGetInsightsReportQuery['$comparison']>;

export type InsightsReportFiltersProps = {
  from: Date;
  to: Date;
  categories: TCategoryVH[];
  paymentMethods: TPaymentMethodVH[];
  categoryOptions: TCategoryVH[];
  paymentMethodOptions: TPaymentMethodVH[];
  granularity: Granularity;
  comparison: Comparison;
  onDateRangeChange: (start: Date | null, end: Date | null) => void;
  onCategoriesChange: (categories: TCategoryVH[]) => void;
  onPaymentMethodsChange: (paymentMethods: TPaymentMethodVH[]) => void;
  onGranularityChange: (granularity: Granularity) => void;
  onComparisonChange: (comparison: Comparison) => void;
};

export const InsightsReportFilters: React.FC<InsightsReportFiltersProps> = ({
  from,
  to,
  categories,
  paymentMethods,
  categoryOptions,
  paymentMethodOptions,
  granularity,
  comparison,
  onDateRangeChange,
  onCategoriesChange,
  onPaymentMethodsChange,
  onGranularityChange,
  onComparisonChange,
}) => {
  const t = useAppTranslations();
  return (
    <Card>
      <Card.Header>
        <Stack>
          <Card.Title>{t('Report filters')}</Card.Title>
          <Card.Subtitle>{t('All analytics use the same selection')}</Card.Subtitle>
        </Stack>
        <Stack direction="row" spacing={1} sx={{flexWrap: 'wrap', justifyContent: 'flex-end'}}>
          <DateRangePicker
            size="small"
            defaultValue={{startDate: from, endDate: to}}
            onDateRangeChange={onDateRangeChange}
          />
          <FormControl size="small" sx={{minWidth: 120}}>
            <InputLabel id="insights-report-granularity-label">{t('Grouping')}</InputLabel>
            <Select
              labelId="insights-report-granularity-label"
              id="insights-report-granularity"
              label={t('Grouping')}
              value={granularity}
              onChange={event => onGranularityChange(event.target.value as Granularity)}
            >
              <MenuItem value="auto">{t('Automatic')}</MenuItem>
              <MenuItem value="day">{t('Day')}</MenuItem>
              <MenuItem value="week">{t('Week')}</MenuItem>
              <MenuItem value="month">{t('Month')}</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{minWidth: 140}}>
            <InputLabel id="insights-report-comparison-label">{t('Compare')}</InputLabel>
            <Select
              labelId="insights-report-comparison-label"
              id="insights-report-comparison"
              label={t('Compare')}
              value={comparison}
              onChange={event => onComparisonChange(event.target.value as Comparison)}
            >
              <MenuItem value="previous">{t('Previous period')}</MenuItem>
              <MenuItem value="none">{t('No comparison')}</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Card.Header>
      <Grid container spacing={1.5} sx={{mt: 1}}>
        <Grid size={{xs: 12, md: 6}}>
          <Autocomplete
            multiple
            size="small"
            options={categoryOptions}
            value={categories}
            onChange={(_, value) => onCategoriesChange(value)}
            getOptionLabel={option => option.name}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            renderInput={params => <TextField {...params} label={t('Categories')} />}
            disableCloseOnSelect
          />
        </Grid>
        <Grid size={{xs: 12, md: 6}}>
          <Autocomplete
            multiple
            size="small"
            options={paymentMethodOptions}
            value={paymentMethods}
            onChange={(_, value) => onPaymentMethodsChange(value)}
            getOptionLabel={option => option.name}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            renderInput={params => <TextField {...params} label={t('Payment methods')} />}
            disableCloseOnSelect
          />
        </Grid>
      </Grid>
    </Card>
  );
};
