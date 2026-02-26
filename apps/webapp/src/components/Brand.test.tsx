import {render, screen} from '@testing-library/react';
import {describe, expect, it} from 'vitest';

import {Brand} from './Brand';

describe('Brand', () => {
  it('renders the app name "BudgetBuddyDE"', () => {
    render(<Brand />);
    expect(screen.getByText('BudgetBuddyDE')).toBeInTheDocument();
  });

  it('renders as plain text by default (not a link)', () => {
    render(<Brand />);
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('renders as a link when asLink is true', () => {
    render(<Brand asLink />);
    expect(screen.getByRole('link')).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute('href', '/');
  });

  it('renders without crashing with custom styles', () => {
    const {container} = render(
      <Brand boxStyle={{m: 1}} iconStyle={{fontSize: 24}} typographyStyle={{fontWeight: 400}} />,
    );
    expect(container).not.toBeEmptyDOMElement();
  });
});
