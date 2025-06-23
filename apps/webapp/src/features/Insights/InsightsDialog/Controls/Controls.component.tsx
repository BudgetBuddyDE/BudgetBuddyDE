import {Button, Stack} from '@mui/material';
import {format} from 'date-fns';
import React from 'react';

import {DateRange} from '@/components/Base/Input';
import {CategoryService, useCategories} from '@/features/Category';
import {downloadAsJson} from '@/utils';

import {type TInsightsChartData, type TState, type TStateAction} from '../InsightsDialog.component';
import {SelectCategories, type TSelectCategoriesOption} from '../SelectCategories';
import {SelectData} from '../SelectData';

export type TControlsProps = {
  state: TState;
  dispatch: React.Dispatch<TStateAction>;
  chartData: TInsightsChartData[];
};

export const Controls: React.FC<TControlsProps> = ({state, dispatch, chartData}) => {
  const {isLoading: isLoadingCategories, data: categories} = useCategories();

  const categoryOptions: TSelectCategoriesOption[] = React.useMemo(() => {
    return CategoryService.toSelectOption(categories ?? []);
  }, [categories]);

  return (
    <Stack flexDirection={'row'} justifyContent={'space-between'}>
      <Stack flexDirection={'row'} alignItems={'center'} columnGap={2}>
        <SelectData value={state.type} onChange={type => dispatch({action: 'SET_TYPE', type})} />

        <SelectCategories
          options={categoryOptions}
          value={state.categories}
          onChange={values => {
            dispatch({action: 'SET_CATEGORIES', categories: values});
          }}
          isLoading={isLoadingCategories}
          sx={{width: 350}}
        />

        {chartData.length > 0 && (
          <Button
            variant="contained"
            sx={{height: 'min-content'}}
            onClick={() => {
              downloadAsJson(chartData, `bb_insights_${format(new Date(), 'yyyy_mm_dd')}`);
            }}>
            Export
          </Button>
        )}

        {import.meta.env.DEV && state.transactions.length > 0 && (
          <Button
            variant="contained"
            color="warning"
            sx={{height: 'min-content'}}
            onClick={() => {
              downloadAsJson(state.transactions, `bb_insights_transactions_${format(new Date(), 'yyyy_mm_dd')}`);
            }}>
            Export Transactions
          </Button>
        )}
      </Stack>

      <DateRange
        inputSize="small"
        defaultStartDate={state.dateRange.startDate}
        defaultEndDate={state.dateRange.endDate}
        onDateChange={range => dispatch({action: 'SET_DATE_RANGE', range})}
      />
    </Stack>
  );
};
