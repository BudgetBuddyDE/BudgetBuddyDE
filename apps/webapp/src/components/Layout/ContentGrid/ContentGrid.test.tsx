import {render, screen} from '@testing-library/react';
import {describe, expect, it} from 'vitest';

import {ContentGrid} from './ContentGrid';

describe('ContentGrid', () => {
  it('renders the title', () => {
    render(<ContentGrid title="Transactions" />);
    expect(screen.getByText('Transactions')).toBeInTheDocument();
  });

  it('renders the description when provided', () => {
    render(<ContentGrid title="Budget" description="Manage your budgets" />);
    expect(screen.getByText('Manage your budgets')).toBeInTheDocument();
  });

  it('renders children', () => {
    render(
      <ContentGrid title="Dashboard">
        <div data-testid="child-content">Content</div>
      </ContentGrid>,
    );
    expect(screen.getByTestId('child-content')).toBeInTheDocument();
  });

  it('renders a back button when withNavigateBack is true', () => {
    render(<ContentGrid title="Go Back Page" withNavigateBack navigateBackPath="/home" />);
    expect(screen.getByRole('link')).toBeInTheDocument();
  });

  it('renders without crashing when only title is provided', () => {
    const {container} = render(<ContentGrid title="Minimal" />);
    expect(container).not.toBeEmptyDOMElement();
  });
});
