import {render, screen} from '@testing-library/react';
import {describe, expect, it} from 'vitest';

import {Brand} from './Brand';

describe('Brand', () => {
  it('renders the logo without the title by default', () => {
    render(<Brand />);
    expect(screen.getByRole('img', {name: 'BudgetBuddyDE logo'})).toHaveAttribute('src', '/logo.png');
    expect(screen.queryByText('BudgetBuddyDE')).not.toBeInTheDocument();
  });

  it('renders the app title when showTitle is true', () => {
    render(<Brand showTitle />);
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
      <Brand boxStyle={{m: 1}} logoStyle={{borderRadius: 1}} showTitle typographyStyle={{fontWeight: 400}} />,
    );
    expect(container).not.toBeEmptyDOMElement();
  });
});
