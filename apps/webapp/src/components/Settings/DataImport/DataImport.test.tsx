import {fireEvent, render, screen} from '@testing-library/react';
import {Provider} from 'react-redux';
import {describe, expect, it} from 'vitest';
import {SnackbarProvider} from '@/components/Snackbar';
import {makeStore} from '@/lib/store';
import {DataImport} from './DataImport';

describe('DataImport', () => {
  it('lets the user choose an export archive before creating a preview', () => {
    render(
      <SnackbarProvider>
        <Provider store={makeStore()}>
          <DataImport />
        </Provider>
      </SnackbarProvider>,
    );

    fireEvent.click(screen.getByRole('button', {name: 'Import data'}));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('button', {name: 'Preview import'})).toBeDisabled();
    expect(screen.getByText(/Auth data and attachments are not imported/i)).toBeInTheDocument();
  });
});
