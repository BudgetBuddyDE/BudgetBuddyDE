import {act, fireEvent, render, screen} from '@testing-library/react';
import {describe, expect, it, vi} from 'vitest';

import {EntityMenu} from './EntityMenu';

type TestEntity = {id: number; name: string};

const entity: TestEntity = {id: 1, name: 'Test Item'};

describe('EntityMenu', () => {
  it('renders without crashing', () => {
    const {container} = render(<EntityMenu entity={entity} handleEditEntity={vi.fn()} handleDeleteEntity={vi.fn()} />);
    expect(container).not.toBeEmptyDOMElement();
  });

  it('shows Edit and Delete options when the menu button is clicked', async () => {
    render(<EntityMenu entity={entity} handleEditEntity={vi.fn()} handleDeleteEntity={vi.fn()} />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button'));
    });
    expect(screen.getByText('Edit')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  it('calls handleEditEntity with the entity when Edit is clicked', async () => {
    const handleEditEntity = vi.fn();
    render(<EntityMenu entity={entity} handleEditEntity={handleEditEntity} handleDeleteEntity={vi.fn()} />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button'));
    });
    fireEvent.click(screen.getByText('Edit'));
    expect(handleEditEntity).toHaveBeenCalledWith(entity);
  });

  it('calls handleDeleteEntity with the entity when Delete is clicked', async () => {
    const handleDeleteEntity = vi.fn();
    render(<EntityMenu entity={entity} handleEditEntity={vi.fn()} handleDeleteEntity={handleDeleteEntity} />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button'));
    });
    fireEvent.click(screen.getByText('Delete'));
    expect(handleDeleteEntity).toHaveBeenCalledWith(entity);
  });

  it('renders additional custom actions', async () => {
    render(
      <EntityMenu
        entity={entity}
        handleEditEntity={vi.fn()}
        handleDeleteEntity={vi.fn()}
        actions={[{children: 'Archive'}]}
      />,
    );
    await act(async () => {
      fireEvent.click(screen.getByRole('button'));
    });
    expect(screen.getByText('Archive')).toBeInTheDocument();
  });

  it('renders children alongside the menu', () => {
    render(
      <EntityMenu entity={entity} handleEditEntity={vi.fn()} handleDeleteEntity={vi.fn()}>
        <span data-testid="extra-child">Extra</span>
      </EntityMenu>,
    );
    expect(screen.getByTestId('extra-child')).toBeInTheDocument();
  });
});
