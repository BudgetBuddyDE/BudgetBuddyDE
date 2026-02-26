import {fireEvent, render, screen} from '@testing-library/react';
import {describe, expect, it, vi} from 'vitest';

import {CloseIconButton} from './CloseIconButton';

describe('CloseIconButton', () => {
  it('renders an icon button with aria-label "close"', () => {
    render(<CloseIconButton />);
    expect(screen.getByRole('button', {name: 'close'})).toBeInTheDocument();
  });

  it('calls onClick handler when clicked', () => {
    const onClick = vi.fn();
    render(<CloseIconButton onClick={onClick} />);
    fireEvent.click(screen.getByRole('button', {name: 'close'}));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('can be disabled', () => {
    render(<CloseIconButton disabled />);
    expect(screen.getByRole('button', {name: 'close'})).toBeDisabled();
  });
});
