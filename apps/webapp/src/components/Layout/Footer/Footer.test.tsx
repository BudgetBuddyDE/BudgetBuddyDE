import {render, screen} from '@testing-library/react';
import {describe, expect, it} from 'vitest';

import {Footer} from './Footer';

describe('Footer', () => {
  it('renders the copyright symbol', () => {
    render(<Footer />);
    expect(screen.getByText(/©/)).toBeInTheDocument();
  });

  it('renders the current year', () => {
    render(<Footer />);
    const year = new Date().getFullYear().toString();
    expect(screen.getByText(new RegExp(year))).toBeInTheDocument();
  });

  it('renders a link to budget-buddy.de', () => {
    render(<Footer />);
    const link = screen.getByRole('link', {name: 'BudgetBuddyDE'});
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', 'https://budget-buddy.de');
  });

  it('renders without crashing', () => {
    const {container} = render(<Footer />);
    expect(container).not.toBeEmptyDOMElement();
  });
});
