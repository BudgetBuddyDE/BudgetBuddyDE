import {MantineProvider} from '@mantine/core';
import {fireEvent, render, screen, within} from '@testing-library/react';
import {createRef} from 'react';
import type {ChangeEvent, ReactNode} from 'react';
import {describe, expect, it, vi} from 'vitest';
import {PasswordInput} from './PasswordInput';
import type {PasswordInputProps} from './PasswordInput';

function TestProvider({children}: {children: ReactNode}) {
  return (
    <MantineProvider env="test" defaultColorScheme="light">
      {children}
    </MantineProvider>
  );
}

function renderPasswordInput(props: PasswordInputProps = {}) {
  return render(<PasswordInput label="Password" {...props} />, {wrapper: TestProvider});
}

function getInput() {
  return screen.getByLabelText(/^Password(?:\s*\*)?$/);
}

function getRequirementItems() {
  return within(screen.getByRole('list', {name: 'Password requirements'})).getAllByRole('listitem');
}

describe('PasswordInput', () => {
  it('hides validation by default, including after typing', () => {
    renderPasswordInput();
    fireEvent.change(getInput(), {target: {value: 'abc'}});

    expect(getInput()).toHaveValue('abc');
    expect(screen.queryByRole('meter')).not.toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.queryByText('For full strength, include:')).not.toBeInTheDocument();
  });

  it('hides validation when explicitly disabled for a prefilled password', () => {
    renderPasswordInput({withValidation: false, defaultValue: 'Abcd12!'});

    expect(getInput()).toHaveValue('Abcd12!');
    expect(screen.queryByRole('meter')).not.toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('shows all missing criteria for an empty password and links the hints to the input', () => {
    renderPasswordInput({withValidation: true});

    const requirements = screen.getByRole('list', {name: 'Password requirements'});
    expect(getInput()).toHaveAttribute('aria-details', requirements.id);
    expect(getRequirementItems()).toHaveLength(5);
    for (const item of getRequirementItems()) {
      expect(item).toHaveTextContent('Missing:');
    }
    expect(screen.getByRole('meter', {name: 'Password strength'})).toHaveAttribute('aria-valuenow', '0');
    expect(screen.getByRole('meter')).toHaveAttribute('aria-valuetext', 'Empty');
    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
    expect(screen.getByRole('status')).toHaveTextContent(
      'Missing: At least 6 characters, A number, A lowercase letter, An uppercase letter, A special symbol (e.g. !, @, #).',
    );
  });

  it.each([
    {password: '', strength: 0, label: 'Empty', segments: [0, 0, 0, 0]},
    {password: 'a', strength: 10, label: 'Weak', segments: [100, 0, 0, 0]},
    {password: 'abcde', strength: 20, label: 'Weak', segments: [100, 0, 0, 0]},
    {password: 'abcdef', strength: 40, label: 'Fair', segments: [100, 100, 0, 0]},
    {password: 'Abcdef', strength: 60, label: 'Good', segments: [100, 100, 100, 0]},
    {password: 'Abcd12', strength: 80, label: 'Strong', segments: [100, 100, 100, 100]},
    {password: 'Abcd12!', strength: 100, label: 'Strong', segments: [100, 100, 100, 100]},
  ])('reports $label strength ($strength) for "$password"', ({password, strength, label, segments}) => {
    renderPasswordInput({withValidation: true, defaultValue: password});

    const meter = screen.getByRole('meter', {name: 'Password strength'});
    expect(meter).toHaveAttribute('aria-valuenow', String(strength));
    expect(meter).toHaveAttribute('aria-valuetext', label);
    expect(meter).toHaveAttribute('aria-valuemin', '0');
    expect(meter).toHaveAttribute('aria-valuemax', '100');
    expect(
      within(meter)
        .getAllByRole('progressbar', {hidden: true})
        .map(segment => segment.getAttribute('aria-valuenow')),
    ).toEqual(segments.map(String));
  });

  it.each([
    {password: 'Ab1!x', missing: 'At least 6 characters'},
    {password: 'Abcdef!', missing: 'A number'},
    {password: 'ABC123!', missing: 'A lowercase letter'},
    {password: 'abc123!', missing: 'An uppercase letter'},
    {password: 'Abcd12', missing: 'A special symbol (e.g. !, @, #)'},
  ])('identifies "$missing" as the only missing criterion', ({password, missing}) => {
    renderPasswordInput({withValidation: true, defaultValue: password});

    expect(screen.getByRole('status')).toHaveTextContent(`Missing: ${missing}.`);
    const items = getRequirementItems();
    expect(items.filter(item => item.textContent?.startsWith('Missing:'))).toHaveLength(1);
    expect(items.filter(item => item.textContent?.startsWith('Met:'))).toHaveLength(4);
    expect(items.find(item => item.textContent?.startsWith('Missing:'))).toHaveTextContent(`Missing: ${missing}`);
  });

  it('updates the hints when criteria are met and when the password is cleared again', () => {
    renderPasswordInput({withValidation: true});
    fireEvent.change(getInput(), {target: {value: 'abc'}});

    expect(getRequirementItems().find(item => item.textContent?.includes('A lowercase letter'))).toHaveTextContent(
      'Met: A lowercase letter',
    );
    expect(screen.getByRole('status')).toHaveTextContent(
      'Missing: At least 6 characters, A number, An uppercase letter',
    );

    fireEvent.change(getInput(), {target: {value: 'Ab1!xy'}});

    expect(screen.getByRole('status')).toHaveTextContent('All password requirements met.');
    for (const item of getRequirementItems()) {
      expect(item).toHaveTextContent('Met:');
    }
    expect(screen.getByRole('meter')).toHaveAttribute('aria-valuenow', '100');

    fireEvent.change(getInput(), {target: {value: ''}});

    for (const item of getRequirementItems()) {
      expect(item).toHaveTextContent('Missing:');
    }
    expect(screen.getByRole('meter')).toHaveAttribute('aria-valuenow', '0');
    expect(screen.getByRole('status')).not.toHaveTextContent('All password requirements met.');
  });

  it('preserves the input value and external hint association when validation is toggled', () => {
    const {rerender} = renderPasswordInput({'aria-details': 'external-hint'});
    fireEvent.change(getInput(), {target: {value: 'Abcd12!'}});

    rerender(<PasswordInput label="Password" aria-details="external-hint" withValidation />);

    expect(getInput()).toHaveValue('Abcd12!');
    expect(getInput()).toHaveAttribute(
      'aria-details',
      `external-hint ${screen.getByRole('list', {name: 'Password requirements'}).id}`,
    );
    expect(screen.getByRole('status')).toHaveTextContent('All password requirements met.');

    rerender(<PasswordInput label="Password" aria-details="external-hint" withValidation={false} />);

    expect(getInput()).toHaveValue('Abcd12!');
    expect(getInput()).toHaveAttribute('aria-details', 'external-hint');
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
    expect(screen.queryByRole('meter')).not.toBeInTheDocument();
  });

  it('updates an uncontrolled value and passes the change event to the caller', () => {
    const onChange = vi.fn((event: ChangeEvent<HTMLInputElement>) => event.currentTarget.value);
    renderPasswordInput({defaultValue: 'initial', onChange, withValidation: true});

    expect(getInput()).toHaveValue('initial');
    fireEvent.change(getInput(), {target: {value: 'Abcd12!'}});

    expect(getInput()).toHaveValue('Abcd12!');
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveReturnedWith('Abcd12!');
    expect(screen.getByRole('status')).toHaveTextContent('All password requirements met.');
  });

  it('uses the controlled value until the parent updates it', () => {
    const onChange = vi.fn((event: ChangeEvent<HTMLInputElement>) => event.currentTarget.value);
    const {rerender} = renderPasswordInput({value: 'abc', onChange, withValidation: true});

    fireEvent.change(getInput(), {target: {value: 'Abcd12!'}});

    expect(onChange).toHaveReturnedWith('Abcd12!');
    expect(getInput()).toHaveValue('abc');
    expect(screen.getByRole('meter')).toHaveAttribute('aria-valuenow', '10');

    rerender(<PasswordInput label="Password" value="Abcd12!" onChange={onChange} withValidation />);

    expect(getInput()).toHaveValue('Abcd12!');
    expect(screen.getByRole('meter')).toHaveAttribute('aria-valuenow', '100');
    expect(screen.getByRole('status')).toHaveTextContent('All password requirements met.');
  });

  it('forwards the input ref and native form props while retaining supplied errors', () => {
    const ref = createRef<HTMLInputElement>();
    render(
      <form aria-label="Sign up">
        <PasswordInput
          label="Password"
          id="new-password"
          name="password"
          autoComplete="new-password"
          placeholder="Choose a password"
          required
          error="Passwords do not match."
          ref={ref}
        />
      </form>,
      {wrapper: TestProvider},
    );

    expect(ref.current).toBe(getInput());
    expect(getInput()).toHaveAttribute('id', 'new-password');
    expect(getInput()).toHaveAttribute('autocomplete', 'new-password');
    expect(getInput()).toHaveAttribute('placeholder', 'Choose a password');
    expect(getInput()).toBeRequired();
    expect(getInput()).toHaveAccessibleDescription('Passwords do not match.');
    expect(screen.getByText('Passwords do not match.')).toBeVisible();

    fireEvent.change(getInput(), {target: {value: 'Abcd12!'}});

    expect(new FormData(screen.getByRole<HTMLFormElement>('form', {name: 'Sign up'})).get('password')).toBe('Abcd12!');
  });

  it('supports the visibility toggle by mouse and keyboard without changing the value', () => {
    renderPasswordInput({defaultValue: 'Abcd12!', visibilityToggleFocusable: true});
    const toggle = screen.getByRole('button', {name: 'Toggle password visibility'});

    expect(getInput()).toHaveAttribute('type', 'password');
    fireEvent.mouseDown(toggle);
    expect(getInput()).toHaveAttribute('type', 'text');
    expect(toggle).toHaveAttribute('aria-pressed', 'true');

    fireEvent.keyDown(toggle, {key: 'Enter'});
    expect(getInput()).toHaveAttribute('type', 'password');
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    expect(getInput()).toHaveValue('Abcd12!');
  });

  it('preserves custom visibility toggle labels', () => {
    renderPasswordInput({visibilityToggleButtonProps: {'aria-label': 'Show confirmation'}});

    expect(screen.getByRole('button', {name: 'Show confirmation'})).toBeInTheDocument();
    expect(screen.queryByRole('button', {name: 'Toggle password visibility'})).not.toBeInTheDocument();
  });
});
