import {render, screen} from '@testing-library/react';
import {describe, expect, it} from 'vitest';

import {PageHeader} from './PageHeader';

describe('PageHeader', () => {
  it('renders the title', () => {
    render(<PageHeader title="Dashboard" />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('renders the description when provided', () => {
    render(<PageHeader title="Settings" description="Manage your account" />);
    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('Manage your account')).toBeInTheDocument();
  });

  it('does not render a description when not provided', () => {
    render(<PageHeader title="Profile" />);
    expect(screen.queryByText('Manage your account')).not.toBeInTheDocument();
  });

  it('renders a back button when withNavigateBack is true', () => {
    render(<PageHeader title="Back Page" withNavigateBack navigateBackPath="/dashboard" />);
    expect(screen.getByRole('link')).toBeInTheDocument();
  });

  it('does not render a back button when withNavigateBack is false', () => {
    render(<PageHeader title="No Back" withNavigateBack={false} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders without crashing when only title is provided', () => {
    const {container} = render(<PageHeader title="Simple" />);
    expect(container).not.toBeEmptyDOMElement();
  });
});
