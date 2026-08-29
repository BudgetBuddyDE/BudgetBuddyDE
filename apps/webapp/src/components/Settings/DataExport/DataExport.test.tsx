import {fireEvent, render, screen} from '@testing-library/react';
import {describe, expect, it} from 'vitest';
import {SnackbarProvider} from '@/components/Snackbar';
import {DataExport} from './DataExport';

describe('DataExport', () => {
  it('lets the user select export format and data categories', () => {
    render(
      <SnackbarProvider>
        <DataExport />
      </SnackbarProvider>,
    );

    fireEvent.click(screen.getByRole('button', {name: 'Export data'}));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('radio', {name: 'JSON'})).toBeChecked();
    expect(screen.getByRole('checkbox', {name: 'Attachments'})).not.toBeDisabled();
    expect(screen.getByRole('checkbox', {name: 'Categories'})).toBeChecked();

    fireEvent.click(screen.getByRole('radio', {name: 'CSV'}));
    fireEvent.click(screen.getByRole('checkbox', {name: 'Auth data'}));
    fireEvent.click(screen.getByRole('checkbox', {name: 'Attachments'}));
    fireEvent.click(screen.getByRole('checkbox', {name: 'Categories'}));

    expect(screen.getByRole('radio', {name: 'CSV'})).toBeChecked();
    expect(screen.getByRole('checkbox', {name: 'Auth data'})).toBeChecked();
    expect(screen.getByRole('checkbox', {name: 'Attachments'})).toBeChecked();
    expect(screen.getByRole('checkbox', {name: 'Categories'})).not.toBeChecked();
  });

  it('disables export when no exportable data is selected', () => {
    render(
      <SnackbarProvider>
        <DataExport />
      </SnackbarProvider>,
    );

    fireEvent.click(screen.getByRole('button', {name: 'Export data'}));
    fireEvent.click(screen.getByRole('checkbox', {name: 'Application data'}));

    expect(screen.getByRole('button', {name: 'Export'})).toBeDisabled();
  });
});
