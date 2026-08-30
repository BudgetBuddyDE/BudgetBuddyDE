import {fireEvent, render, screen} from '@testing-library/react';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {SnackbarProvider} from '@/components/Snackbar';
import {DataExport} from './DataExport';

const {exportApplicationArchive, exportAuthArchive} = vi.hoisted(() => ({
  exportApplicationArchive: vi.fn(),
  exportAuthArchive: vi.fn(),
}));

vi.mock('@/apiClient', () => ({
  apiClient: {
    auth: {dataExport: {exportArchive: exportAuthArchive}},
    backend: {application: {exportArchive: exportApplicationArchive}},
  },
}));

describe('DataExport', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

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

  it('uses the API client for selected auth, application, and attachment archives', async () => {
    const archive = new Blob(['archive'], {type: 'application/zip'});
    exportAuthArchive.mockResolvedValue([archive, null]);
    exportApplicationArchive.mockResolvedValue([archive, null]);
    vi.stubGlobal('URL', {createObjectURL: vi.fn(() => 'blob:archive'), revokeObjectURL: vi.fn()});

    render(
      <SnackbarProvider>
        <DataExport />
      </SnackbarProvider>,
    );
    fireEvent.click(screen.getByRole('button', {name: 'Export data'}));
    fireEvent.click(screen.getByRole('checkbox', {name: 'Auth data'}));
    fireEvent.click(screen.getByRole('checkbox', {name: 'Attachments'}));
    fireEvent.click(screen.getByRole('button', {name: 'Export'}));

    await vi.waitFor(() => expect(exportAuthArchive).toHaveBeenCalledWith('json'));
    expect(exportApplicationArchive).toHaveBeenCalledWith({
      format: 'json',
      resources: ['transactions', 'recurring-payments', 'budgets', 'payment-methods', 'categories'],
    });
    expect(exportApplicationArchive).toHaveBeenCalledWith({format: 'json', resources: ['attachments']});
  });
});
