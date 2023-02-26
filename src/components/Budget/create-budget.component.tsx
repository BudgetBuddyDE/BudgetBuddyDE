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
import { isSameMonth } from 'date-fns';
import React from 'react';
import { AuthContext, SnackbarContext, StoreContext } from '../../context/';
import { Budget, Category } from '../../models/';
import { BudgetService, CategoryService } from '../../services/';
import { IBaseBudget } from '../../types/';
import { transformBalance } from '../../utils/';
import { FormDrawer } from '../Base/';
import { CreateCategoryInfo } from '../Category';

export interface ICreateBudgetProps {
  open: boolean;
  setOpen: (show: boolean) => void;
  afterSubmit?: (budget: Budget) => void;
}

interface CreateBudgetHandler {
  onClose: () => void;
  autocompleteChange: (event: React.SyntheticEvent<Element, Event>, value: string | number) => void;
  inputChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}

export const CreateBudget: React.FC<ICreateBudgetProps> = ({ open, setOpen, afterSubmit }) => {
  const { session } = React.useContext(AuthContext);
  const { showSnackbar } = React.useContext(SnackbarContext);
  const { loading, setLoading, categories, setCategories, budget, setBudget, transactions } =
    React.useContext(StoreContext);
  const [, startTransition] = React.useTransition();
  const [form, setForm] = React.useState<Partial<IBaseBudget>>({});
  const [errorMessage, setErrorMessage] = React.useState('');

  const handler: CreateBudgetHandler = {
    onClose: () => {
      setOpen(false);
    },
    autocompleteChange: (event, value) => {
      setForm((prev) => ({ ...prev, category: Number(value) }));
    },
    inputChange: (event) => {
      setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
    },
    onSubmit: async (event) => {
      try {
        event.preventDefault();
        // Check if the user has already set an budget for this category
        if (budget.some((budget) => budget.category.id === form.category))
          throw new Error("You've already set an Budget for this category");

        const values = Object.keys(form);
        ['category', 'budget'].forEach((field) => {
          if (!values.includes(field)) throw new Error('Provide an ' + field);
        });

        const createdBudgets = await BudgetService.create([
          {
            category: Number(form.category),
            budget: transformBalance(form.budget!.toString()),
            created_by: session!.user!.id,
          },
        ]);
        if (createdBudgets.length < 1) throw new Error('No budget saved');

        const createdBudget = createdBudgets[0];
        const addedBudget = new Budget({
          id: createdBudget.id,
          // We can 100% assure that categories are provided
          category: (categories.data as Category[]).find((c) => c.id === createdBudget.category)!.categoryView,
          budget: createdBudget.budget,
          currentlySpent:
            transactions.data !== null
              ? Math.abs(
                  transactions.data
                    .filter(
                      (transaction) =>
                        transaction.amount < 0 &&
                        isSameMonth(new Date(transaction.date), new Date()) &&
                        new Date(transaction.date) <= new Date() &&
                        transaction.categories.id === createdBudget.category
                    )
                    .reduce((prev, cur) => prev + cur.amount, 0)
                )
              : 0,
          created_by: createdBudget.created_by,
          updated_at: createdBudget.updated_at.toString(),
          inserted_at: createdBudget.inserted_at.toString(),
        });

        if (afterSubmit) afterSubmit(addedBudget);
        startTransition(() => {
          setBudget((prev) => [...prev, addedBudget]);
        });
        handler.onClose();
        showSnackbar({
          message: `Budget for category '${addedBudget.category.name}' saved`,
        });
      } catch (error) {
        console.error(error);
        // @ts-ignore
        setErrorMessage(error.message || 'Unkown error');
      }
    },
  };

  React.useEffect(() => {
    if (!session || !session.user) return;
    if (categories.fetched && categories.data !== null) return;
    setLoading(true);
    CategoryService.getCategories()
      .then((rows) => setCategories({ type: 'FETCH_DATA', data: rows }))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [session, categories]);

  if (loading) return null;
  return (
    <FormDrawer
      open={open}
      heading="Set Budget"
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

      {categories.fetched && categories.data && categories.data.length > 0 ? (
        <Autocomplete
          id="add-category"
          options={categories.data.map((item) => ({ label: item.name, value: item.id }))}
          sx={{ mb: 2 }}
          onChange={(event, value) => handler.autocompleteChange(event, Number(value?.value))}
          renderInput={(props) => <TextField {...props} label="Category" />}
          isOptionEqualToValue={(option, value) => option.value === value.value}
        />
      ) : (
        <CreateCategoryInfo sx={{ mb: 2 }} />
      )}

      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel htmlFor="add-budget">Monthly Budget</InputLabel>
        <OutlinedInput
          id="add-budget"
          label="Monthly Budget"
          name="budget"
          inputProps={{ inputMode: 'numeric' }}
          onChange={handler.inputChange}
          startAdornment={<InputAdornment position="start">€</InputAdornment>}
        />
      </FormControl>
    </FormDrawer>
  );
};
