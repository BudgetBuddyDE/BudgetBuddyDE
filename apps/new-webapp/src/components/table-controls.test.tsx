import {render, screen, within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {describe, expect, it, vi} from 'vitest';
import {I18nProvider} from '@/lib/i18n';
import {BulkActionToolbar, MultiSelectFilter, PageSizeControl, RowActionMenu} from './table-controls';

function renderLocalized(node: React.ReactNode) {
  return render(<I18nProvider>{node}</I18nProvider>);
}

describe('shared table controls', () => {
  it('selects and individually removes multiple filter values', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    const {rerender} = renderLocalized(
      <MultiSelectFilter
        label="Category"
        clearLabel="Remove category"
        options={[
          {value: 'food', label: 'Food'},
          {value: 'travel', label: 'Travel'},
        ]}
        values={[]}
        onChange={onChange}
      />,
    );
    await user.click(screen.getByRole('button', {name: 'Category'}));
    await user.click(screen.getByRole('menuitemcheckbox', {name: 'Food'}));
    expect(onChange).toHaveBeenCalledWith(['food']);

    rerender(
      <I18nProvider>
        <MultiSelectFilter
          label="Category"
          clearLabel="Remove category"
          options={[
            {value: 'food', label: 'Food'},
            {value: 'travel', label: 'Travel'},
          ]}
          values={['food', 'travel']}
          onChange={onChange}
        />
      </I18nProvider>,
    );
    await user.click(screen.getByRole('button', {name: 'Remove category: Food'}));
    expect(onChange).toHaveBeenLastCalledWith(['travel']);
  });

  it('renders only functional row actions without leaking clicks', async () => {
    const edit = vi.fn();
    const rowClick = vi.fn();
    const user = userEvent.setup();
    renderLocalized(
      <div onClick={rowClick}>
        <RowActionMenu label="Actions for Lunch" actions={[{id: 'edit', label: 'Edit', onSelect: edit}]} />
      </div>,
    );
    await user.click(screen.getByRole('button', {name: 'Actions for Lunch'}));
    await user.click(screen.getByRole('menuitem', {name: 'Edit'}));
    expect(edit).toHaveBeenCalledOnce();
    expect(rowClick).not.toHaveBeenCalled();
  });

  it('offers all shared page sizes and updates the selected size', async () => {
    const onChange = vi.fn();
    renderLocalized(<PageSizeControl value={10} label="Rows per page" onChange={onChange} />);
    expect(
      within(screen.getByLabelText('Rows per page'))
        .getAllByRole('option')
        .map(option => option.textContent),
    ).toEqual(['10', '25', '50', '100']);
    await userEvent.selectOptions(screen.getByLabelText('Rows per page'), '50');
    expect(onChange).toHaveBeenCalledWith(50);
  });

  it('shows selection count and confirms bulk deletion', async () => {
    const onDelete = vi.fn();
    const user = userEvent.setup();
    renderLocalized(
      <BulkActionToolbar
        count={3}
        entityLabel="transactions"
        selectionLabel="Selected"
        deleteLabel="Delete"
        exportLabel="Export"
        exportCsvLabel="CSV"
        exportJsonLabel="JSON"
        confirmTitle="Delete 3 transactions?"
        confirmDescription="Selected transactions will be deleted."
        canDelete
        onDelete={onDelete}
        onExport={vi.fn()}
      />,
    );
    expect(screen.getByRole('toolbar')).toHaveTextContent('Selected: 3');
    await user.click(screen.getByRole('button', {name: 'Delete'}));
    await user.click(within(screen.getByRole('dialog')).getByRole('button', {name: 'Delete'}));
    expect(onDelete).toHaveBeenCalledOnce();
  });
});
