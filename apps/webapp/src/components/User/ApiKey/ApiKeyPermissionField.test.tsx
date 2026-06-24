import type {PermissionConfig} from '@budgetbuddyde/api/auth';
import {fireEvent, render, screen} from '@testing-library/react';
import React from 'react';
import {describe, expect, it} from 'vitest';
import {ApiKeyPermissionField} from './ApiKeyPermissionField';

const PermissionFieldHarness = () => {
  const [permissions, setPermissions] = React.useState<PermissionConfig>({});
  return <ApiKeyPermissionField value={permissions} onChange={setPermissions} />;
};

describe('ApiKeyPermissionField', () => {
  it('renders every entity with read and write options', () => {
    render(<PermissionFieldHarness />);

    expect(screen.getAllByRole('checkbox')).toHaveLength(10);
    expect(screen.getByLabelText('Transactions Read')).toBeInTheDocument();
    expect(screen.getByLabelText('Payment methods Write')).toBeInTheDocument();
  });

  it('allows permissions to be selected independently', () => {
    render(<PermissionFieldHarness />);

    const readTransactions = screen.getByLabelText('Transactions Read');
    const writeTransactions = screen.getByLabelText('Transactions Write');

    fireEvent.click(readTransactions);
    expect(readTransactions).toBeChecked();
    expect(writeTransactions).not.toBeChecked();

    fireEvent.click(writeTransactions);
    expect(readTransactions).toBeChecked();
    expect(writeTransactions).toBeChecked();

    fireEvent.click(readTransactions);
    expect(readTransactions).not.toBeChecked();
    expect(writeTransactions).toBeChecked();
  });
});
