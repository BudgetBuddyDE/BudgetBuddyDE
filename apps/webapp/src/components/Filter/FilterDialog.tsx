'use client';

import type {TCategoryVH} from '@budgetbuddyde/api/category';
import type {TPaymentMethodVH} from '@budgetbuddyde/api/paymentMethod';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  type DialogProps,
  DialogTitle,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import type React from 'react';
import {CloseIconButton} from '@/components/Button';
import type {FilterAction, FilterState} from '@/components/Filter/FilterReducer';
import {Autocomplete} from '@/components/Form/Autocomplete';
import {DateRangePicker} from '@/components/Form/DateRangePicker';
import {ZoomTransition} from '@/components/Transition';

export type FilterDialogProps = Pick<DialogProps, 'open'> & {
  onClose?: () => void;
  onReset?: () => void;
  onApply?: () => void;
  withDateRange?: boolean;
  withExecuteDay?: boolean;
  withCategories?: boolean;
  withPaymentMethods?: boolean;
  state: FilterState;
  dispatch: React.Dispatch<FilterAction>;
  categoryOptions: TCategoryVH[];
  paymentMethodOptions: TPaymentMethodVH[];
};

const SectionLabel: React.FC<{label: string}> = ({label}) => (
  <Typography variant="subtitle2" color="text.secondary">
    {label}
  </Typography>
);

export const FilterDialog: React.FC<FilterDialogProps> = ({
  open,
  onClose,
  onReset,
  onApply,
  withDateRange,
  withExecuteDay,
  withCategories,
  withPaymentMethods,
  state,
  dispatch,
  categoryOptions,
  paymentMethodOptions,
}) => {
  const theme = useTheme();
  const isFullscreen = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Dialog
      fullScreen={isFullscreen}
      maxWidth="sm"
      fullWidth
      open={open}
      onClose={onClose}
      scroll="paper"
      slots={{transition: ZoomTransition}}
      slotProps={{paper: {elevation: 0}}}
    >
      <DialogTitle>Filters</DialogTitle>
      <CloseIconButton
        onClick={onClose}
        sx={theme => ({
          position: 'absolute',
          top: theme.spacing(1),
          right: theme.spacing(1),
        })}
      />

      <DialogContent dividers>
        <Stack gap={3}>
          {withDateRange && (
            <Stack gap={1}>
              <SectionLabel label="Date Range" />
              <DateRangePicker
                defaultValue={{startDate: state.dateRange.startDate, endDate: state.dateRange.endDate}}
                onDateRangeChange={(start, end) => dispatch({action: 'SET_DATE_RANGE', startDate: start, endDate: end})}
                dateFormat="dd.MM.yyyy"
                slotProps={{
                  startDatePicker: {
                    slotProps: {
                      textField: {
                        sx: {
                          width: '50%',
                        },
                      },
                    },
                  },
                  endDatePicker: {
                    slotProps: {
                      textField: {
                        sx: {
                          width: '50%',
                        },
                      },
                    },
                  },
                }}
              />
            </Stack>
          )}

          {withExecuteDay && (
            <Stack gap={1}>
              <SectionLabel label="Execute Day (1–31)" />
              <Stack direction="row" gap={2}>
                <TextField
                  label="From day"
                  type="number"
                  size="small"
                  value={state.executeFrom}
                  onChange={e => dispatch({action: 'SET_EXECUTE_FROM', executeFrom: e.target.value})}
                  slotProps={{htmlInput: {min: 1, max: 31}}}
                  sx={{width: 130}}
                />
                <TextField
                  label="To day"
                  type="number"
                  size="small"
                  value={state.executeTo}
                  onChange={e => dispatch({action: 'SET_EXECUTE_TO', executeTo: e.target.value})}
                  slotProps={{htmlInput: {min: 1, max: 31}}}
                  sx={{width: 130}}
                />
              </Stack>
            </Stack>
          )}

          {withCategories && (
            <Stack gap={1}>
              <SectionLabel label="Categories" />
              {/* @ts-expect-error filterOptions only required when searchAsYouType is true */}
              <Autocomplete<TCategoryVH, true>
                name="filter-categories"
                label="Categories"
                placeholder="Any category"
                multiple
                disableCloseOnSelect
                searchAsYouType={false}
                retrieveOptionsFunc={() => categoryOptions}
                value={state.categories}
                onChange={(_, value) => dispatch({action: 'SET_CATEGORIES', categories: value})}
                getOptionLabel={opt => opt.name}
                isOptionEqualToValue={(opt, val) => opt.id === val.id}
              />
            </Stack>
          )}

          {withPaymentMethods && (
            <Stack gap={1}>
              <SectionLabel label="Payment Methods" />
              {/* @ts-expect-error filterOptions only required when searchAsYouType is true */}
              <Autocomplete<TPaymentMethodVH, true>
                name="filter-payment-methods"
                label="Payment Methods"
                placeholder="Any payment method"
                multiple
                disableCloseOnSelect
                searchAsYouType={false}
                retrieveOptionsFunc={() => paymentMethodOptions}
                value={state.paymentMethods}
                onChange={(_, value) => dispatch({action: 'SET_PAYMENT_METHODS', paymentMethods: value})}
                getOptionLabel={opt => opt.name}
                isOptionEqualToValue={(opt, val) => opt.id === val.id}
              />
            </Stack>
          )}
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onReset}>Reset</Button>
        <Button variant="contained" onClick={onApply}>
          Apply
        </Button>
      </DialogActions>
    </Dialog>
  );
};
