import { ChangeEvent, FC, FormEvent, useContext, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  AlertTitle,
  Autocomplete,
  FormControl,
  InputAdornment,
  InputLabel,
  OutlinedInput,
  TextField,
} from '@mui/material';
import { StoreContext } from '../context/store.context';
import { FormDrawer } from './form-drawer.component';
import type { ICategory } from '../types/transaction.interface';
import { SnackbarContext } from '../context/snackbar.context';
import { AuthContext } from '../context/auth.context';
import { FormStyle } from '../theme/form-style';
import { CategoryService } from '../services/category.service';
import { IBaseBudget, IBudget } from '../types/budget.interface';
import { Categories } from '../routes/categories.route';
import { BudgetService } from '../services/budget.service';
import { transformBalance } from '../utils/transformBalance';
import { isSameMonth } from 'date-fns';
import { getCategoryFromList } from '../utils/getCategoryFromList';

export interface IEditBudgetProps {
  open: boolean;
  setOpen: (show: boolean) => void;
  afterSubmit?: (budget: IBudget) => void;
  budget: IBudget | null;
}

export const EditBudget: FC<IEditBudgetProps> = ({ open, setOpen, afterSubmit, budget }) => {
  const { session } = useContext(AuthContext);
  const { showSnackbar } = useContext(SnackbarContext);
  const { loading, categories, setBudget, transactions } = useContext(StoreContext);
  const [form, setForm] = useState<Record<string, string | number>>({});
  const [errorMessage, setErrorMessage] = useState('');

  const shouldBeOpen = useMemo(() => open && form.category !== undefined, [open, form]);

  const handler = {
    onClose: () => {
      setOpen(false);
    },
    autocompleteChange: (event: React.SyntheticEvent<Element, Event>, value: string | number) => {
      setForm((prev) => ({ ...prev, category: value }));
    },
    inputChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
    },
    onSubmit: async (event: FormEvent<HTMLFormElement>) => {
      try {
        event.preventDefault();
        const values = Object.keys(form);
        ['id', 'budget'].forEach((field) => {
          if (!values.includes(field)) throw new Error('Provide an ' + field);
        });

        const data = await BudgetService.update(Number(form.id), {
          budget: transformBalance(form.budget.toString()),
        } as Partial<IBaseBudget>);
        if (data === null) throw new Error('No budget updated');

        const updatedItem = {
          id: data[0].id,
          category: categories.find((category) => category.id === data[0].category) as {
            id: number;
            name: string;
            description: string | null;
          },
          budget: data[0].budget,
        };
        setBudget((prev) =>
          prev.map((budget) => {
            if (budget.id === updatedItem.id) {
              return updatedItem as IBudget;
            } else return budget;
          })
        );
        handler.onClose();
        showSnackbar({
          message: `Budget for category '${updatedItem.category.name}' saved`,
        });
      } catch (error) {
        console.error(error);
        // @ts-ignore
        setErrorMessage(error.message || 'Unkown error');
      }
    },
  };

  useEffect(() => {
    if (budget) {
      setForm({
        id: budget.id,
        category: budget.category.id,
        budget: budget.budget,
      });
    } else setForm({});
  }, [budget]);

  if (loading) return null;
  return (
    <FormDrawer
      open={shouldBeOpen}
      heading="Edit Budget"
      onClose={handler.onClose}
      onSubmit={handler.onSubmit}
      saveLabel="Create"
      closeOnBackdropClick
    >
      {errorMessage.length > 1 && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {errorMessage}
        </Alert>
      )}

      {categories.length === 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <AlertTitle>Info</AlertTitle>
          To be able to create set a budget you have to create a category under{' '}
          <strong>Categories {'>'} Add Category</strong> before.{' '}
        </Alert>
      )}

      {categories.length > 0 && (
        <Autocomplete
          id="edit-category"
          options={categories.map((item) => ({ label: item.name, value: item.id }))}
          sx={{ mb: 2 }}
          onChange={(event, value) => handler.autocompleteChange(event, Number(value?.value))}
          defaultValue={getCategoryFromList(Number(form.category), categories)}
          renderInput={(props) => <TextField {...props} label="Category" />}
          isOptionEqualToValue={(option, value) => option.value === value.value}
          disabled
        />
      )}

      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel htmlFor="edit-budget">Monthly Budget</InputLabel>
        <OutlinedInput
          id="edit-budget"
          label="Monthly Budget"
          name="budget"
          inputProps={{ inputMode: 'numeric' }}
          value={form.budget}
          onChange={handler.inputChange}
          startAdornment={<InputAdornment position="start">€</InputAdornment>}
        />
      </FormControl>
    </FormDrawer>
  );
};
