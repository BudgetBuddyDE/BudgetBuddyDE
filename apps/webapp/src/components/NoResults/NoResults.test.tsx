import {render, screen} from '@testing-library/react';
import {describe, expect, it} from 'vitest';

import {NoResults} from './NoResults';

describe('NoResults', () => {
  it('renders with default text', () => {
    render(<NoResults />);
    expect(screen.getByText('No items found')).toBeInTheDocument();
  });

  it('renders with custom string text', () => {
    render(<NoResults text="Nothing here yet" />);
    expect(screen.getByText('Nothing here yet')).toBeInTheDocument();
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
