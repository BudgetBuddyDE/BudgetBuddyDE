'use client';

import {useState} from 'react';
import {ENTITY_CONFIG, type EntityView} from '@/components/entity-config';
import {parseEntityForm} from '@/components/entity-validation';
import {Button, DialogShell, SelectField, TextField} from '@/components/ui/primitives';
import {useFinance} from '@/lib/finance-provider';
import type {
  BudgetView,
  CategoryView,
  EntityKind,
  FinanceData,
  PaymentMethodView,
  RecurringPaymentView,
  TransactionView,
} from '@/types/finance';

type EditorDefaults = Record<string, string | string[] | undefined>;
interface EntityFieldsProps {
  data: FinanceData;
  defaults: EditorDefaults;
}

type DefaultsFactory = (item?: EntityView) => EditorDefaults;

const ENTITY_DEFAULTS: Record<EntityKind, DefaultsFactory> = {
  transactions: item => {
    if (!item) return {};
    const transaction = item as TransactionView;
    return {
      amount: String(Math.abs(transaction.transferAmount)),
      type: transaction.transferAmount < 0 ? 'expense' : 'income',
      processedAt: transaction.processedAt.toISOString().slice(0, 10),
      receiver: transaction.receiver,
      information: transaction.information ?? '',
      categoryId: transaction.categoryId,
      paymentMethodId: transaction.paymentMethodId,
    };
  },
  categories: item => {
    if (!item) return {};
    const category = item as CategoryView;
    return {name: category.name, description: category.description ?? ''};
  },
  'payment-methods': item => {
    if (!item) return {};
    const method = item as PaymentMethodView;
    return {
      name: method.name,
      provider: method.provider,
      address: method.address,
      description: method.description ?? '',
    };
  },
  recurring: item => {
    if (!item) return {};
    const recurring = item as RecurringPaymentView;
    return {
      amount: String(Math.abs(recurring.transferAmount)),
      type: recurring.transferAmount < 0 ? 'expense' : 'income',
      executeAt: String(recurring.executeAt),
      interval: recurring.interval,
      receiver: recurring.receiver,
      information: recurring.information ?? '',
      categoryId: recurring.categoryId,
      paymentMethodId: recurring.paymentMethodId,
      paused: recurring.paused ? 'true' : 'false',
    };
  },
  budgets: item => {
    if (!item) return {};
    const budget = item as BudgetView;
    return {
      name: budget.name,
      description: budget.description ?? '',
      type: budget.type,
      budget: String(budget.budget),
      categories: budget.categoryIds,
    };
  },
};

function field(defaults: EditorDefaults, name: string) {
  const value = defaults[name];
  return typeof value === 'string' ? value : '';
}

function TransactionFields({data, defaults}: EntityFieldsProps) {
  return (
    <>
      <div className="form-grid two">
        <SelectField label="Type" name="type" defaultValue={field(defaults, 'type') || 'expense'} required>
          <option value="expense">Expense</option>
          <option value="income">Income</option>
        </SelectField>
        <TextField
          label="Amount"
          name="amount"
          type="number"
          min="0.01"
          step="0.01"
          defaultValue={field(defaults, 'amount')}
          required
          autoFocus
        />
      </div>
      <TextField label="Receiver / sender" name="receiver" defaultValue={field(defaults, 'receiver')} required />
      <TextField
        label="Date"
        name="processedAt"
        type="date"
        defaultValue={field(defaults, 'processedAt') || new Date().toISOString().slice(0, 10)}
        required
      />
      <AssignmentFields data={data} defaults={defaults} />
      <TextField
        label="Note"
        name="information"
        defaultValue={field(defaults, 'information')}
        placeholder="Optional context"
      />
    </>
  );
}

function RecurringFields({data, defaults}: EntityFieldsProps) {
  return (
    <>
      <div className="form-grid two">
        <SelectField label="Type" name="type" defaultValue={field(defaults, 'type') || 'expense'} required>
          <option value="expense">Expense</option>
          <option value="income">Income</option>
        </SelectField>
        <TextField
          label="Amount"
          name="amount"
          type="number"
          min="0.01"
          step="0.01"
          defaultValue={field(defaults, 'amount')}
          required
          autoFocus
        />
      </div>
      <TextField label="Receiver / sender" name="receiver" defaultValue={field(defaults, 'receiver')} required />
      <div className="form-grid two">
        <TextField
          label="Day of month"
          name="executeAt"
          type="number"
          min="1"
          max="31"
          defaultValue={field(defaults, 'executeAt') || '1'}
          required
        />
        <SelectField label="Status" name="paused" defaultValue={field(defaults, 'paused') || 'false'}>
          <option value="false">Active</option>
          <option value="true">Paused</option>
        </SelectField>
      </div>
      <SelectField label="Interval" name="interval" defaultValue={field(defaults, 'interval') || 'monthly'}>
        <option value="monthly">Monthly</option>
        <option value="quarterly">Quarterly</option>
        <option value="yearly">Yearly</option>
      </SelectField>
      <AssignmentFields data={data} defaults={defaults} />
      <TextField
        label="Note"
        name="information"
        defaultValue={field(defaults, 'information')}
        placeholder="Optional context"
      />
    </>
  );
}

function AssignmentFields({data, defaults}: EntityFieldsProps) {
  return (
    <div className="form-grid two">
      <SelectField label="Category" name="categoryId" defaultValue={field(defaults, 'categoryId')} required>
        <option value="">Choose category</option>
        {data.categories.map(category => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </SelectField>
      <SelectField
        label="Payment method"
        name="paymentMethodId"
        defaultValue={field(defaults, 'paymentMethodId')}
        required
      >
        <option value="">Choose method</option>
        {data.paymentMethods.map(method => (
          <option key={method.id} value={method.id}>
            {method.name}
          </option>
        ))}
      </SelectField>
    </div>
  );
}

function CategoryFields({defaults}: EntityFieldsProps) {
  return (
    <>
      <TextField label="Name" name="name" defaultValue={field(defaults, 'name')} required autoFocus />
      <TextField label="Description" name="description" defaultValue={field(defaults, 'description')} />
    </>
  );
}

function PaymentMethodFields({defaults}: EntityFieldsProps) {
  return (
    <>
      <TextField label="Name" name="name" defaultValue={field(defaults, 'name')} required autoFocus />
      <div className="form-grid two">
        <TextField label="Provider" name="provider" defaultValue={field(defaults, 'provider')} required />
        <TextField label="Account reference" name="address" defaultValue={field(defaults, 'address')} required />
      </div>
      <TextField label="Description" name="description" defaultValue={field(defaults, 'description')} />
    </>
  );
}

function BudgetFields({data, defaults}: EntityFieldsProps) {
  return (
    <>
      <TextField label="Budget name" name="name" defaultValue={field(defaults, 'name')} required autoFocus />
      <div className="form-grid two">
        <SelectField label="Budget type" name="type" defaultValue={field(defaults, 'type') || 'e'}>
          <option value="e">Expense</option>
          <option value="i">Income</option>
        </SelectField>
        <TextField
          label="Target amount"
          name="budget"
          type="number"
          min="0"
          step="0.01"
          defaultValue={field(defaults, 'budget')}
          required
        />
      </div>
      <SelectField
        label="Categories"
        name="categories"
        multiple
        defaultValue={(defaults.categories as string[] | undefined) ?? []}
        hint="Hold Ctrl or Command to select multiple categories."
      >
        {data.categories.map(category => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </SelectField>
      <TextField label="Description" name="description" defaultValue={field(defaults, 'description')} />
    </>
  );
}

const ENTITY_FIELDS: Record<EntityKind, React.ComponentType<EntityFieldsProps>> = {
  transactions: TransactionFields,
  categories: CategoryFields,
  'payment-methods': PaymentMethodFields,
  recurring: RecurringFields,
  budgets: BudgetFields,
};

export function EntityEditor({
  kind,
  item,
  open,
  onOpenChange,
}: {
  kind: EntityKind;
  item?: EntityView;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const {data, createEntity, updateEntity, mutationPending} = useFinance();
  const [formError, setFormError] = useState<string | null>(null);
  const config = ENTITY_CONFIG[kind];
  const Fields = ENTITY_FIELDS[kind];
  const defaults = ENTITY_DEFAULTS[kind](item);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    const parsed = parseEntityForm(kind, event.currentTarget);
    if (!parsed.input) {
      setFormError(parsed.error ?? 'Check the highlighted fields.');
      return;
    }
    const saved = item ? await updateEntity(kind, item.id, parsed.input) : await createEntity(kind, parsed.input);
    if (saved) onOpenChange(false);
  };

  return (
    <DialogShell
      open={open}
      onOpenChange={onOpenChange}
      title={`${item ? 'Edit' : 'New'} ${config.meta.singular}`}
      description="Required fields are marked. Values are validated before saving."
    >
      <form key={`${kind}-${item?.id ?? 'new'}`} className="entity-form" onSubmit={event => void handleSubmit(event)}>
        <Fields data={data} defaults={defaults} />
        {formError && (
          <div className="form-error" role="alert">
            {formError}
          </div>
        )}
        <div className="form-actions">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" disabled={mutationPending}>
            {mutationPending ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </form>
    </DialogShell>
  );
}
