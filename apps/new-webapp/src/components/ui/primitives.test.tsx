import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {useState} from 'react';
import {describe, expect, it, vi} from 'vitest';
import {
  Badge,
  Button,
  ConfirmDialog,
  DialogShell,
  PasswordField,
  ProgressBar,
  SelectField,
  TextField,
} from './primitives';

describe('UI primitives', () => {
  it('exposes labels, descriptions, variants, and progress semantics', () => {
    render(
      <>
        <Button variant="danger">Remove</Button>
        <TextField label="Amount" name="amount" hint="In euros" />
        <SelectField label="Status">
          <option>Active</option>
        </SelectField>
        <Badge tone="good">Healthy</Badge>
        <ProgressBar value={1.2} label="Food budget" />
      </>,
    );
    expect(screen.getByRole('button', {name: 'Remove'})).toHaveClass('button-danger');
    expect(screen.getByLabelText('Amount')).toHaveAccessibleDescription('In euros');
    expect(screen.getByLabelText('Status')).toHaveValue('Active');
    expect(screen.getByText('Healthy')).toHaveClass('badge-good');
    expect(screen.getByRole('progressbar', {name: 'Food budget'})).toHaveAttribute('aria-valuenow', '100');
  });

  it('toggles password visibility without changing its value or validation state', async () => {
    const user = userEvent.setup();
    render(<PasswordField label="Password" defaultValue="secret-value" error="Password error" />);
    const input = screen.getByLabelText('Password');
    expect(input).toHaveAttribute('type', 'password');
    expect(input).toHaveValue('secret-value');
    expect(input).toHaveAttribute('aria-invalid', 'true');

    await user.click(screen.getByRole('button', {name: 'Show password'}));
    expect(input).toHaveAttribute('type', 'text');
    expect(input).toHaveValue('secret-value');
    expect(screen.getByRole('button', {name: 'Hide password'})).toHaveFocus();
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });

  it('manages dialog state and closes after confirmation', async () => {
    const confirm = vi.fn();
    const user = userEvent.setup();
    render(
      <ConfirmDialog
        trigger={<Button>Delete item</Button>}
        title="Delete item?"
        description="It will be removed."
        onConfirm={confirm}
      />,
    );
    await user.click(screen.getByRole('button', {name: 'Delete item'}));
    expect(screen.getByRole('dialog')).toHaveTextContent('This action cannot be undone.');
    await user.click(screen.getByRole('button', {name: 'Confirm'}));
    expect(confirm).toHaveBeenCalledOnce();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('composes controlled dialog content', () => {
    function Harness() {
      const [open, setOpen] = useState(true);
      return (
        <DialogShell open={open} onOpenChange={setOpen} title="Editor" description="Change values">
          <p>Form content</p>
        </DialogShell>
      );
    }
    render(<Harness />);
    expect(screen.getByRole('dialog', {name: 'Editor'})).toHaveTextContent('Form content');
  });
});
