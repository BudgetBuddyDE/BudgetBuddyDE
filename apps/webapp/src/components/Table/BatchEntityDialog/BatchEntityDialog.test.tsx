import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import {describe, expect, it, vi} from 'vitest';
import {BatchEntityDialog, type BatchEntityDialogProps} from './BatchEntityDialog';

type TestRow = {
  id: string;
  name: string;
};

type TestPayload = {
  name: string;
};

const columns: BatchEntityDialogProps<TestRow, TestPayload>['columns'] = [
  {field: 'name', headerName: 'Name', editable: true, flex: 1},
];

const createProps = (
  overrides: Partial<BatchEntityDialogProps<TestRow, TestPayload>> = {},
): BatchEntityDialogProps<TestRow, TestPayload> => ({
  open: true,
  title: 'Batch users',
  mode: 'CREATE',
  initialRows: [],
  columns,
  createEmptyRow: () => ({id: `new-${Math.random()}`, name: ''}),
  mapRowsToPayload: rows => ({success: true, payload: rows.map(row => ({name: row.name}))}),
  onSubmit: vi.fn(async () => undefined),
  onClose: vi.fn(),
  ...overrides,
});

describe('BatchEntityDialog', () => {
  it('renders a full-screen create grid and can add/remove rows', async () => {
    render(<BatchEntityDialog {...createProps({createEmptyRow: () => ({id: crypto.randomUUID(), name: 'empty'})})} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', {name: 'Batch users'})).toBeInTheDocument();
    await waitFor(() => expect(screen.getAllByText('empty')).toHaveLength(1));

    fireEvent.click(screen.getByRole('button', {name: 'Add row'}));
    await waitFor(() => expect(screen.getAllByText('empty')).toHaveLength(2));

    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[1]);
    fireEvent.click(screen.getByRole('button', {name: 'Remove selected'}));
    await waitFor(() => expect(screen.getAllByText('empty')).toHaveLength(1));
  });

  it('shows mapping issues without submitting', async () => {
    const onSubmit = vi.fn(async () => undefined);
    const mapRowsToPayload = vi.fn(() => ({
      success: false as const,
      issues: [{rowId: 'new', message: 'Name is required'}],
    }));

    render(
      <BatchEntityDialog
        {...createProps({
          createEmptyRow: () => ({id: 'new', name: ''}),
          mapRowsToPayload,
          onSubmit,
        })}
      />,
    );

    fireEvent.click(screen.getByRole('button', {name: 'Save'}));
    expect(mapRowsToPayload).toHaveBeenCalledWith([{id: 'new', name: ''}]);
    expect(await screen.findByText('Row 1: Name is required')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('keeps the dialog open and allows retry after an API error', async () => {
    const onSubmit = vi
      .fn<BatchEntityDialogProps<TestRow, TestPayload>['onSubmit']>()
      .mockRejectedValueOnce(new Error('Request failed'))
      .mockResolvedValue(undefined);

    const onClose = vi.fn();
    render(
      <BatchEntityDialog {...createProps({createEmptyRow: () => ({id: 'new', name: 'valid'}), onSubmit, onClose})} />,
    );

    fireEvent.click(screen.getByRole('button', {name: 'Save'}));
    expect(await screen.findByText('Request failed')).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', {name: 'Save'}));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(2));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
