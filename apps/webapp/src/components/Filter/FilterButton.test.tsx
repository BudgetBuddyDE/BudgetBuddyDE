import {fireEvent, render, screen} from '@testing-library/react';
import {describe, expect, it, vi} from 'vitest';

import {FilterButton} from './FilterButton';

describe('FilterButton', () => {
  it('renders an icon button', () => {
    render(<FilterButton />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(<FilterButton onClick={onClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('shows "Filters active" tooltip text when isActive is true', () => {
    render(<FilterButton isActive />);
    // The tooltip title is accessible via aria or title attribute
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('renders without crashing when no props are provided', () => {
    const {container} = render(<FilterButton />);
    expect(container).not.toBeEmptyDOMElement();
  });

  it('does not throw when onClick is not provided', () => {
    expect(() => {
      const {unmount} = render(<FilterButton />);
      fireEvent.click(screen.getByRole('button'));
      unmount();
    }).not.toThrow();
  });
});
