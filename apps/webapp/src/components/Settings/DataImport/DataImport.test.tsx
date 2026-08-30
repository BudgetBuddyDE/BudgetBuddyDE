import type {TApplicationImportResult} from '@budgetbuddyde/api/applicationImport';
import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import {Provider} from 'react-redux';
import {describe, expect, it, vi} from 'vitest';
import {SnackbarProvider} from '@/components/Snackbar';
import {makeStore} from '@/lib/store';
import {DataImport} from './DataImport';

const {importArchive} = vi.hoisted(() => ({importArchive: vi.fn()}));

vi.mock('@/apiClient', () => ({
  apiClient: {backend: {application: {importArchive}}},
}));

const resourceResult = {created: [], failed: [], skipped: []};
const preview = {
  budgets: [],
  categories: [{data: {description: null, id: 'category-1', name: 'Food'}, row: 1, sourceId: 'category-1'}],
  'payment-methods': [],
  'recurring-payments': [],
  transactions: [
    {
      data: {id: 'transaction-1', receiver: 'Market', transferAmount: -32.5},
      row: 1,
      sourceId: 'transaction-1',
    },
  ],
};

const previewResult: TApplicationImportResult = {
  mode: 'preview',
  preview,
  resources: {
    budgets: resourceResult,
    categories: {
      ...resourceResult,
      created: [{code: 'persistence', message: 'Ready to import', row: 1, sourceId: 'category-1'}],
    },
    'payment-methods': resourceResult,
    'recurring-payments': resourceResult,
    transactions: resourceResult,
  },
  summary: {created: 1, failed: 0, received: 2, skipped: 0},
};

const failedCommitResult: TApplicationImportResult = {
  ...previewResult,
  mode: 'commit',
  resources: {
    ...previewResult.resources,
    categories: {
      ...resourceResult,
      created: [{code: 'persistence', message: 'Category imported', row: 1, sourceId: 'category-1'}],
      failed: [{code: 'persistence', message: 'Category could not be saved', row: 1, sourceId: 'category-1'}],
    },
    transactions: {
      ...resourceResult,
      failed: [{code: 'persistence', message: 'Transaction could not be saved', row: 1, sourceId: 'transaction-1'}],
      skipped: [{code: 'duplicate', message: 'Transaction already exists', row: 1, sourceId: 'transaction-1'}],
    },
  },
  summary: {created: 1, failed: 2, received: 3, skipped: 1},
};

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
    expect(screen.getByRole('button', {name: 'Preview files'})).toBeDisabled();
    expect(screen.getByText(/Auth data and attachments are not imported/i)).toBeInTheDocument();
    expect(screen.getByText('Upload file')).toBeInTheDocument();
    expect(screen.getByText('Successful imports')).toBeInTheDocument();
    expect(screen.getByText('Failed imports')).toBeInTheDocument();
  });

  it('shows import records in resource tabs', async () => {
    importArchive.mockResolvedValueOnce([previewResult, null]).mockResolvedValueOnce([failedCommitResult, null]);
    render(
      <SnackbarProvider>
        <Provider store={makeStore()}>
          <DataImport />
        </Provider>
      </SnackbarProvider>,
    );
    fireEvent.click(screen.getByRole('button', {name: 'Import data'}));
    const input = document.querySelector('input[type="file"]');
    expect(input).not.toBeNull();
    fireEvent.change(input as HTMLInputElement, {target: {files: [new File(['archive'], 'export.zip')]}});
    fireEvent.click(screen.getByRole('button', {name: 'Preview files'}));

    expect(await screen.findByRole('table', {name: 'Preview Categories'})).toBeInTheDocument();
    expect(screen.getByText('Food')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', {name: 'Transactions (1)'}));
    expect(screen.getByRole('table', {name: 'Preview Transactions'})).toBeInTheDocument();
    expect(screen.getByText('Market')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', {name: 'Import 1 records'}));
    expect(await screen.findByRole('table', {name: 'Successful imports Categories'})).toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', {name: 'Transactions (1)'}));
    expect(screen.getByRole('table', {name: 'Successful imports Transactions'})).toBeInTheDocument();
    expect(screen.getByText('Transaction already exists')).toBeInTheDocument();

    fireEvent.click(await screen.findByRole('button', {name: 'Show failed imports'}));

    await waitFor(() => expect(screen.getByRole('table', {name: 'Failed imports Categories'})).toBeInTheDocument());
    expect(screen.getByText('Category could not be saved')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', {name: 'Transactions (1)'}));
    expect(screen.getByRole('table', {name: 'Failed imports Transactions'})).toBeInTheDocument();
    expect(screen.getByText('Transaction could not be saved')).toBeInTheDocument();
  });
});
