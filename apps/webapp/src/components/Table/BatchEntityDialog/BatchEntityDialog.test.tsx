import {fireEvent, render, screen, waitFor, within} from '@testing-library/react';
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

let nextRowId = 0;

const createProps = (
  overrides: Partial<BatchEntityDialogProps<TestRow, TestPayload>> = {},
): BatchEntityDialogProps<TestRow, TestPayload> => ({
  open: true,
  title: 'Batch users',
  mode: 'CREATE',
  initialRows: [],
  columns,
  createEmptyRow: () => ({id: `new-${nextRowId++}`, name: ''}),
  mapRowsToPayload: rows => ({success: true, payload: rows.map(row => ({name: row.name}))}),
  onSubmit: vi.fn(async () => undefined),
  onClose: vi.fn(),
  ...overrides,
});

const startEditing = async (value = 'Original') => {
  fireEvent.doubleClick(await screen.findByRole('gridcell', {name: value}));
  return screen.findByRole('textbox');
};

const editName = async (value: string, previousValue = 'Original') => {
  const input = await startEditing(previousValue);
  fireEvent.change(input, {target: {value}});
  fireEvent.keyDown(input, {key: 'Enter'});
  await waitFor(() => expect(screen.queryByRole('textbox')).not.toBeInTheDocument());
};

const getConfirmation = () => screen.findByRole('dialog', {name: 'Discard unsaved changes?'});

const closeDialog = (control: 'close' | 'Cancel' | 'Escape') => {
  if (control === 'Escape') fireEvent.keyDown(screen.getByRole('dialog'), {key: 'Escape'});
  else fireEvent.click(screen.getByRole('button', {name: control}));
};

describe('BatchEntityDialog', () => {
  it.each(['date', 'number', 'boolean', 'singleSelect'] as const)(
    'protects pending %s values and compares dates by value',
    async type => {
      type ValueRow = {id: string; value: Date | number | boolean | string};
      const initialValues = {date: new Date(2026, 9, 17), number: 10, boolean: false, singleSelect: 'first'};
      const onClose = vi.fn();
      render(
        <BatchEntityDialog<ValueRow, ValueRow>
          open
          title="Batch values"
          mode="EDIT"
          initialRows={[{id: 'value', value: initialValues[type]}]}
          columns={[
            {field: 'value', headerName: 'Value', type, editable: true, valueOptions: ['first', 'second'], width: 200},
          ]}
          createEmptyRow={() => ({id: 'new', value: ''})}
          mapRowsToPayload={rows => ({success: true, payload: rows})}
          onSubmit={vi.fn(async () => undefined)}
          onClose={onClose}
        />,
      );
      // The first cell is the row-selection checkbox; the second is the value.
      await waitFor(() => expect(screen.getAllByRole('gridcell')).toHaveLength(2));
      fireEvent.doubleClick(screen.getAllByRole('gridcell')[1]);
      if (type === 'date') {
        const input = await screen.findByDisplayValue('2026-10-17');
        fireEvent.change(input, {target: {value: '2026-10-18'}});
        fireEvent.keyDown(input, {key: 'Escape'});
      } else if (type === 'number') {
        const input = await screen.findByRole('spinbutton');
        fireEvent.change(input, {target: {value: '20'}});
        fireEvent.keyDown(input, {key: 'Escape'});
      } else if (type === 'boolean') {
        const input = within(screen.getAllByRole('gridcell')[1]).getByRole('checkbox');
        fireEvent.click(input);
        fireEvent.keyDown(input, {key: 'Escape'});
      } else {
        fireEvent.click(await screen.findByRole('option', {name: 'second'}));
        closeDialog('Cancel');
      }
      const confirmation = await getConfirmation();
      expect(onClose).not.toHaveBeenCalled();
      fireEvent.click(within(confirmation).getByRole('button', {name: 'Keep editing'}));
      await waitFor(() => expect(screen.queryByText('Discard unsaved changes?')).not.toBeInTheDocument());
      if (type === 'date') {
        const input = screen.getByDisplayValue('2026-10-18');
        fireEvent.change(input, {target: {value: '2026-10-17'}});
        fireEvent.keyDown(input, {key: 'Escape'});
        expect(onClose).toHaveBeenCalledTimes(1);
        expect(screen.queryByText('Discard unsaved changes?')).not.toBeInTheDocument();
      }
    },
  );

  describe.each(['CREATE', 'EDIT'] as const)('%s close protection', mode => {
    const modeProps = () =>
      createProps({
        mode,
        initialRows: [{id: 'existing', name: 'Original'}],
        createEmptyRow: () => ({id: `new-${nextRowId++}`, name: 'Original'}),
      });

    it.each(['close', 'Cancel', 'Escape'] as const)('closes an unchanged draft through %s', async control => {
      const props = modeProps();
      render(<BatchEntityDialog {...props} />);
      await screen.findByRole('gridcell', {name: 'Original'});

      closeDialog(control);

      expect(props.onClose).toHaveBeenCalledTimes(1);
      expect(screen.queryByText('Discard unsaved changes?')).not.toBeInTheDocument();
    });

    it.each(['close', 'Cancel', 'Escape'] as const)('confirms changed drafts through %s', async control => {
      const props = modeProps();
      render(<BatchEntityDialog {...props} />);
      await editName('Changed');

      closeDialog(control);

      const confirmation = await getConfirmation();
      expect(confirmation).toHaveAccessibleDescription(
        'Your unsaved changes will be lost. Do you want to discard them?',
      );
      expect(props.onClose).not.toHaveBeenCalled();
      expect(props.onSubmit).not.toHaveBeenCalled();
      fireEvent.click(within(confirmation).getByRole('button', {name: 'Discard changes'}));
      expect(props.onClose).toHaveBeenCalledTimes(1);
      expect(props.onSubmit).not.toHaveBeenCalled();
    });

    it.each(['Keep editing', 'Escape', 'backdrop'] as const)('preserves active input after %s', async action => {
      const props = modeProps();
      render(<BatchEntityDialog {...props} />);
      const input = await startEditing();
      fireEvent.change(input, {target: {value: 'Uncommitted'}});
      fireEvent.keyDown(input, {key: 'Escape'});

      const confirmation = await getConfirmation();
      const keepEditing = within(confirmation).getByRole('button', {name: 'Keep editing'});
      await waitFor(() => expect(keepEditing).toHaveFocus());
      expect(props.onClose).not.toHaveBeenCalled();
      if (action === 'Escape') fireEvent.keyDown(confirmation, {key: 'Escape'});
      else if (action === 'backdrop') {
        // MUI recognizes backdrop clicks through its dialog container.
        const container = confirmation.parentElement!;
        fireEvent.mouseDown(container);
        fireEvent.click(container);
      } else fireEvent.click(keepEditing);

      await waitFor(() => expect(screen.queryByText('Discard unsaved changes?')).not.toBeInTheDocument());
      expect(input).toHaveValue('Uncommitted');
      expect(props.onClose).not.toHaveBeenCalled();
      fireEvent.keyDown(input, {key: 'Enter'});
      await waitFor(() => expect(screen.queryByRole('textbox')).not.toBeInTheDocument());
      fireEvent.click(screen.getByRole('button', {name: 'Save'}));
      await waitFor(() => expect(props.onSubmit).toHaveBeenCalledWith([{name: 'Uncommitted'}]));
      expect(props.onClose).toHaveBeenCalledTimes(1);
      expect(screen.queryByText('Discard unsaved changes?')).not.toBeInTheDocument();
    });

    it('does not prompt after reverting an edit or selecting a row', async () => {
      const props = modeProps();
      render(<BatchEntityDialog {...props} />);
      await editName('Changed');
      await editName('Original', 'Changed');
      fireEvent.click(screen.getAllByRole('checkbox')[1]);
      closeDialog('Cancel');
      expect(props.onClose).toHaveBeenCalledTimes(1);
      expect(screen.queryByText('Discard unsaved changes?')).not.toBeInTheDocument();
    });
  });

  it('compares an unchanged active cell against the opening snapshot', async () => {
    const props = createProps({mode: 'EDIT', initialRows: [{id: 'existing', name: 'Original'}]});
    render(<BatchEntityDialog {...props} />);
    const input = await startEditing();
    fireEvent.keyDown(input, {key: 'Escape'});
    expect(props.onClose).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Discard unsaved changes?')).not.toBeInTheDocument();
  });

  it('protects an added empty row and becomes unchanged when that row is removed', async () => {
    const props = createProps();
    render(<BatchEntityDialog {...props} />);
    await waitFor(() => expect(screen.getAllByRole('row')).toHaveLength(2));
    fireEvent.click(screen.getByRole('button', {name: 'Add row'}));
    closeDialog('Cancel');
    fireEvent.click(within(await getConfirmation()).getByRole('button', {name: 'Keep editing'}));
    await waitFor(() => expect(screen.queryByText('Discard unsaved changes?')).not.toBeInTheDocument());
    fireEvent.click(screen.getAllByRole('checkbox')[2]);
    fireEvent.click(screen.getByRole('button', {name: 'Remove selected'}));
    closeDialog('Cancel');
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it('preserves edits on parent refresh and resets confirmation and drafts on reopening', async () => {
    const props = createProps({mode: 'EDIT', initialRows: [{id: 'existing', name: 'Original'}]});
    const {rerender} = render(<BatchEntityDialog {...props} />);
    await editName('Changed');
    const refreshedProps = {...props, initialRows: [{id: 'existing', name: 'Refreshed'}]};
    rerender(<BatchEntityDialog {...refreshedProps} />);
    expect(screen.getByRole('gridcell', {name: 'Changed'})).toBeInTheDocument();
    closeDialog('Cancel');
    await getConfirmation();
    rerender(<BatchEntityDialog {...refreshedProps} open={false} />);
    rerender(<BatchEntityDialog {...refreshedProps} />);
    expect(await screen.findByRole('gridcell', {name: 'Refreshed'})).toBeInTheDocument();
    expect(screen.queryByText('Discard unsaved changes?')).not.toBeInTheDocument();
    closeDialog('Cancel');
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

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

  it('retains dirty drafts and close protection after validation fails', async () => {
    const props = createProps({
      mode: 'EDIT',
      initialRows: [{id: 'existing', name: 'Original'}],
      mapRowsToPayload: () => ({success: false, issues: [{rowId: 'existing', message: 'Invalid name'}]}),
    });
    render(<BatchEntityDialog {...props} />);
    await editName('Invalid');
    fireEvent.click(screen.getByRole('button', {name: 'Save'}));
    expect(await screen.findByText('Row 1: Invalid name')).toBeInTheDocument();
    closeDialog('Cancel');
    fireEvent.click(within(await getConfirmation()).getByRole('button', {name: 'Keep editing'}));
    await waitFor(() => expect(screen.queryByText('Discard unsaved changes?')).not.toBeInTheDocument());
    expect(screen.getByRole('gridcell', {name: 'Invalid'})).toBeInTheDocument();
    expect(screen.getByText('Row 1: Invalid name')).toBeInTheDocument();
    expect(props.onSubmit).not.toHaveBeenCalled();
    expect(props.onClose).not.toHaveBeenCalled();
  });

  it('keeps the dialog open and allows retry after an API error', async () => {
    const onSubmit = vi
      .fn<BatchEntityDialogProps<TestRow, TestPayload>['onSubmit']>()
      .mockRejectedValueOnce(new Error('Request failed'))
      .mockResolvedValue(undefined);

    const onClose = vi.fn();
    render(
      <BatchEntityDialog
        {...createProps({createEmptyRow: () => ({id: 'new', name: 'Original'}), onSubmit, onClose})}
      />,
    );

    await editName('Changed');
    fireEvent.click(screen.getByRole('button', {name: 'Save'}));
    expect(await screen.findByText('Request failed')).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    closeDialog('Cancel');
    fireEvent.click(within(await getConfirmation()).getByRole('button', {name: 'Keep editing'}));
    await waitFor(() => expect(screen.queryByText('Discard unsaved changes?')).not.toBeInTheDocument());
    expect(screen.getByRole('gridcell', {name: 'Changed'})).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', {name: 'Save'}));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(2));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
