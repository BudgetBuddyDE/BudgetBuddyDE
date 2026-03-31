import {render, screen} from '@testing-library/react';
import {describe, expect, it} from 'vitest';

import {AppLogo} from './AppLogo';

describe('AppLogo', () => {
  it('renders an image with the correct alt text', () => {
    render(<AppLogo />);
    expect(screen.getByAltText('BudgetBuddy Logo')).toBeInTheDocument();
  });

  it('renders an image with src pointing to /logo.png', () => {
    render(<AppLogo />);
    expect(screen.getByAltText('BudgetBuddy Logo')).toHaveAttribute('src', '/logo.png');
  });

  it('renders without crashing when no props are provided', () => {
    const {container} = render(<AppLogo />);
    expect(container).not.toBeEmptyDOMElement();
  });

  it('forwards additional image props', () => {
    render(<AppLogo data-testid="app-logo" />);
    expect(screen.getByTestId('app-logo')).toBeInTheDocument();
  });
});
