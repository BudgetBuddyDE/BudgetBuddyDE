import {Button} from '@mui/material';
import {fireEvent, render, screen} from '@testing-library/react';
import {describe, expect, it, vi} from 'vitest';

import {NoResults} from './NoResults';

describe('NoResults', () => {
  it('renders with default text', () => {
    const {container} = render(<NoResults />);
    expect(screen.getByText('Nothing to show yet')).toBeInTheDocument();
    expect(container.querySelector('.MuiCard-root')).toBeInTheDocument();
  });

  it('renders a Paper surface when requested', () => {
    const {container} = render(<NoResults surface="paper" />);

    expect(container.querySelector('.MuiCard-root')).not.toBeInTheDocument();
    expect(container.querySelector('.MuiPaper-root')).toBeInTheDocument();
  });

  it('renders without a surface when requested', () => {
    const {container} = render(<NoResults surface="none" />);

    expect(container.querySelector('.MuiCard-root, .MuiPaper-root')).not.toBeInTheDocument();
  });

  it('renders with custom string text', () => {
    render(<NoResults text="Nothing here yet" />);
    expect(screen.getByText('Nothing here yet')).toBeInTheDocument();
  });

  it('renders a filtered empty state with the query', () => {
    render(<NoResults variant="filtered" query="groceries" />);
    expect(screen.getByRole('heading', {name: 'No results for "groceries"'})).toBeInTheDocument();
    expect(screen.getByText('Try a different search term or clear one of your filters.')).toBeInTheDocument();
  });

  it('renders a create empty state with its action', () => {
    render(
      <NoResults
        variant="create"
        action={
          <Button variant="outlined" onClick={() => undefined}>
            Create item
          </Button>
        }
      />,
    );
    expect(screen.getByRole('heading', {name: 'Create your first item'})).toBeInTheDocument();
    expect(screen.getByRole('button', {name: 'Create item'})).toBeInTheDocument();
  });

  it('renders and invokes the default create button', () => {
    const onCreate = vi.fn();
    render(<NoResults variant="create" createLabel="Create budget" onCreate={onCreate} />);

    fireEvent.click(screen.getByRole('button', {name: 'Create budget'}));

    expect(onCreate).toHaveBeenCalledOnce();
  });

  it('renders a React node when text is a node', () => {
    render(<NoResults text={<span data-testid="custom-node">Custom content</span>} />);
    expect(screen.getByTestId('custom-node')).toBeInTheDocument();
  });

  it('renders an icon when icon prop is provided', () => {
    render(<NoResults text="Empty" icon={<span data-testid="test-icon">★</span>} />);
    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
    expect(screen.getByText('Empty')).toBeInTheDocument();
  });

  it('does not render an icon container when no icon is given', () => {
    render(<NoResults text="No icon" />);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});
