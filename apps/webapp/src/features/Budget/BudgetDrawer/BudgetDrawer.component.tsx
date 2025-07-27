import {Grid2 as Grid, InputAdornment, TextField, ToggleButton, ToggleButtonGroup} from '@mui/material';
import React from 'react';
import {Controller, DefaultValues} from 'react-hook-form';

import {AppConfig} from '@/app.config';
import {ActionPaper} from '@/components/Base/ActionPaper';
import {EntityDrawer, TUseEntityDrawerState} from '@/components/Drawer/EntityDrawer';
import {useAuthContext} from '@/features/Auth';
import {type TCategoryAutocompleteOption, useCategories} from '@/features/Category';
import {SelectCategories, type TSelectCategoriesOption} from '@/features/Insights/InsightsDialog/SelectCategories';
import {useSnackbarContext} from '@/features/Snackbar';
import {logger} from '@/logger';
import {CreateOrUpdateBudget, type NullableFields, type TBudget, type TCreateOrUpdateBudget} from '@/newTypes';
import {isRunningOnIOs, parseNumber} from '@/utils';

import {BudgetService} from '../BudgetService';
import {useBudgets} from '../useBudgets.hook';

export type TBudgetDrawerValues = {
  categoryAutocomplete: TCategoryAutocompleteOption[];
} & Pick<NullableFields<TCreateOrUpdateBudget>, 'ID' | 'name' | 'budget' | 'type' | 'toCategories'>;

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
  const [selectedCategories, setSelectedCategories] = React.useState<TSelectCategoriesOption[]>([]); // FIXME: Remove this and resolve issue with SelectCategories component
  const {refreshData: refreshBudgets} = useBudgets();

  const CategoryOptions: TSelectCategoriesOption[] = React.useMemo(() => {
    if (!categories) return [];
    return categories.map(category => ({
      label: category.name,
      value: category.ID,
    }));
  }, [categories]);

  const TypeOptions: {value: TBudget['type']; label: string; description: string}[] = [
    {value: 'i', label: 'Include', description: 'Budget related to the selected categories'},
    {value: 'e', label: 'Exclude', description: 'Budget excluding the selected categories'},
  ];

  const handler = {
    async handleSubmit(data: TBudgetDrawerValues, onSuccess: () => void) {
      if (!session) throw new Error('No session-user not found');

      switch (drawerAction) {
        case 'CREATE':
          try {
            const parsedForm = CreateOrUpdateBudget.safeParse({
              ...data,
              budget: parseNumber(String(data.budget)),
              toCategories: selectedCategories.map(category => ({
                toCategory_ID: category.value,
              })),
            });
            if (!parsedForm.success) throw new Error(parsedForm.error.message);
            const record = await BudgetService.createBudget(parsedForm.data);
            onClose();
            onSuccess();
            React.startTransition(() => {
              refreshBudgets();
            });
            showSnackbar({message: `Set budget #${record.ID}`});
          } catch (error) {
            logger.error("Something wen't wrong", error);
            showSnackbar({message: (error as Error).message});
          }
          break;

        case 'UPDATE':
          try {
            const parsedForm = CreateOrUpdateBudget.safeParse({
              ...data,
              budget: parseNumber(String(data.budget)),
              toCategories: selectedCategories.map(category => ({
                toCategory_ID: category.value,
              })),
            });
            if (!parsedForm.success) throw new Error(parsedForm.error.message);
            const record = await BudgetService.updateBudget(defaultValues?.ID!, parsedForm.data);
            onClose();
            onSuccess();
            React.startTransition(() => {
              refreshBudgets();
            });
            showSnackbar({message: `Set budget #${record.ID}`});
          } catch (error) {
            logger.error("Something wen't wrong", error);
            showSnackbar({message: (error as Error).message});
          }
          break;
      }
    },
    resetValues() {
      return {
        ID: null,
        type: null,
        name: null,
        budget: null,
        toCategories: null,
        categoryAutocomplete: [],
      } as DefaultValues<TBudgetDrawerValues>;
    },
  };

  React.useEffect(() => {
    if (defaultValues && defaultValues.categoryAutocomplete) {
      setSelectedCategories(
        defaultValues.categoryAutocomplete.map(category => ({
          value: category?.ID!,
          label: category?.name!,
        })),
      );
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
      onSubmit={handler.handleSubmit}
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
                    {TypeOptions.map(({value, label}) => (
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
              label="Name"
              {...register('name', {required: 'Name is required'})}
              error={!!errors.name}
              helperText={errors.name?.message}
              required
              fullWidth
            />
          </Grid>
          <Grid size={{xs: 12}}>
            <Controller
              control={control}
              name="categoryAutocomplete"
              render={() => (
                <SelectCategories
                  isLoading={isLoadingCategories}
                  options={CategoryOptions}
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
