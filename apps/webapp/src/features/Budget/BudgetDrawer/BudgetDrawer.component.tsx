import {type TBudget} from '@budgetbuddyde/types';
import {Button, Grid2 as Grid, InputAdornment, TextField, ToggleButton, ToggleButtonGroup} from '@mui/material';
import React from 'react';
import {Controller, DefaultValues} from 'react-hook-form';

import {AppConfig} from '@/app.config';
import {ActionPaper} from '@/components/Base/ActionPaper';
import {EntityDrawer, TUseEntityDrawerState} from '@/components/Drawer/EntityDrawer';
import {useAuthContext} from '@/features/Auth';
import {useCategories} from '@/features/Category';
import {SelectCategories, type TSelectCategoriesOption} from '@/features/Insights/InsightsDialog/SelectCategories';
import {useSnackbarContext} from '@/features/Snackbar';
import {logger} from '@/logger';
import {isRunningOnIOs} from '@/utils';

export type TBudgetDrawerValues = {
  id?: TBudget['id'];
  label: TBudget['label'] | null;
  budget: TBudget['budget'] | null;
  categories: TSelectCategoriesOption[];
} & Pick<TBudget, 'type'>;

export type TBudgetDrawerProps = TUseEntityDrawerState<TBudgetDrawerValues> & {
  onClose: () => void;
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
};

export const BudgetDrawer: React.FC<TBudgetDrawerProps> = ({
  open,
  drawerAction,
  defaultValues,
  onClose,
  closeOnBackdropClick,
  closeOnEscape,
}) => {
  const {session} = useAuthContext();
  const {showSnackbar} = useSnackbarContext();
  const {isLoading: isLoadingCategories, data: categories} = useCategories();
  const [selectedCategories, setSelectedCategories] = React.useState<TBudgetDrawerValues['categories']>([]); // FIXME: Remove this and resolve issue with SelectCategories component
  // const {refreshData: refreshBudgets} = useBudgets();

  const categoryOptions: TSelectCategoriesOption[] = React.useMemo(() => {
    return (categories ?? []).map(({id, name}) => ({value: id, label: name}));
  }, [categories]);

  const handler = {
    async handleSubmit(data: TBudgetDrawerValues, onSuccess: () => void) {
      if (!session) throw new Error('No session-user not found');

      switch (drawerAction) {
        case 'CREATE':
          try {
            // TODO: Update this code after a new backend is implemented
            // const parsedForm = ZCreateBudgetPayload.safeParse({
            //   ...data,
            //   categories: data.categories.map(({value}) => value),
            //   budget: parseNumber(String(data.budget ?? 0)),
            //   owner: session.user.id,
            // });
            // if (!parsedForm.success) throw parsedForm.error;
            // const payload: TCreateBudgetPayload = parsedForm.data;
            // const [record, err] = await BudgetService.createBudget(payload);
            // if (err) throw err;
            // onClose();
            // onSuccess();
            // React.startTransition(() => {
            //   refreshBudgets();
            // });
            // showSnackbar({message: `Created budget ${payload.label} (#${record.id})`});
          } catch (error) {
            logger.error("Something wen't wrong", error);
            showSnackbar({
              message: (error as Error).message,
              action: <Button onClick={() => handler.handleSubmit(data, onSuccess)}>Retry</Button>,
            });
          }
          break;

        case 'UPDATE':
          try {
            // TODO: Update this code after a new backend is implemented
            // if (!data.id) throw new Error('No budget id found');
            // const parsedForm = ZUpdateBudgetPayload.safeParse({
            //   ...data,
            //   categories: data.categories.map(({value}) => value),
            //   budget: parseNumber(String(data.budget ?? 0)),
            //   owner: session.user.id,
            // });
            // if (!parsedForm.success) throw parsedForm.error;
            // const payload: TUpdateBudgetPayload = parsedForm.data;
            // const [record, err] = await BudgetService.updateBudget(data.id, payload);
            // if (err) throw err;
            // onClose();
            // onSuccess();
            // React.startTransition(() => {
            //   refreshBudgets();
            // });
            // showSnackbar({message: `Updated budget ${payload.label} (#${record.id})`});
          } catch (error) {
            logger.error("Something wen't wrong", error);
            showSnackbar({
              message: (error as Error).message,
              action: <Button onClick={() => handler.handleSubmit(data, onSuccess)}>Retry</Button>,
            });
          }
          break;
      }
    },
    resetValues() {
      setSelectedCategories([]);
      return {
        type: 'include',
        label: null,
        categories: [],
        budget: null,
      } as DefaultValues<TBudgetDrawerValues>;
    },
  };

  React.useEffect(() => {
    if (defaultValues && defaultValues.categories) {
      setSelectedCategories((defaultValues.categories ?? []) as TBudgetDrawerValues['categories']);
    }
  }, [defaultValues]);

  return (
    <EntityDrawer<TBudgetDrawerValues>
      open={open}
      onClose={onClose}
      onResetForm={handler.resetValues}
      title="Budget"
      subtitle={`${drawerAction === 'CREATE' ? 'Create a new' : 'Update an'} budget`}
      defaultValues={defaultValues}
      onSubmit={(data, onSuccess) => {
        data.categories = selectedCategories;
        handler.handleSubmit(data, onSuccess);
      }}
      closeOnBackdropClick={closeOnBackdropClick}
      closeOnEscape={closeOnEscape}>
      {({
        form: {
          register,
          formState: {errors},
          control,
        },
      }) => (
        <Grid container spacing={AppConfig.baseSpacing} sx={{p: 2}}>
          <Grid size={{xs: 12}}>
            <ActionPaper>
              <Controller
                control={control}
                name="type"
                defaultValue={defaultValues?.type}
                rules={{required: 'Type is required'}}
                render={({field: {onChange, value}}) => (
                  <ToggleButtonGroup
                    color="primary"
                    value={value}
                    onChange={(_, newValue) => {
                      if (newValue) onChange(newValue);
                    }}
                    fullWidth
                    exclusive>
                    {[
                      {value: 'include', label: 'Include', description: 'Budget related to the selected categories'},
                      {value: 'exclude', label: 'Exclude', description: 'Budget excluding the selected categories'},
                    ].map(({value, label}) => (
                      <ToggleButton value={value} fullWidth>
                        {label}
                      </ToggleButton>
                    ))}
                  </ToggleButtonGroup>
                )}
              />
            </ActionPaper>
          </Grid>
          <Grid size={{xs: 12}}>
            <TextField
              label="Label"
              {...register('label', {required: 'Label is required'})}
              error={!!errors.label}
              helperText={errors.label?.message}
              required
              fullWidth
            />
          </Grid>
          <Grid size={{xs: 12}}>
            <Controller
              control={control}
              name="categories"
              render={() => (
                <SelectCategories
                  isLoading={isLoadingCategories}
                  options={categoryOptions}
                  onChange={setSelectedCategories}
                  value={selectedCategories}
                  size="medium"
                />
              )}
            />
          </Grid>
          <Grid size={{xs: 12}}>
            <TextField
              label="Budget"
              {...register('budget', {required: 'Budget is required'})}
              error={!!errors.budget}
              helperText={errors.budget?.message}
              type="number"
              required
              fullWidth
              slotProps={{
                input: {startAdornment: <InputAdornment position="start">€</InputAdornment>},
                htmlInput: {inputMode: isRunningOnIOs() ? 'text' : 'numeric'},
              }}
            />
          </Grid>
        </Grid>
      )}
    </EntityDrawer>
  );
};
