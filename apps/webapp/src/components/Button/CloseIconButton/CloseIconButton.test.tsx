import {describe, expect, it, vi} from 'vite-plus/test';
import {fireEvent, render, screen} from '@/test/testing-library';

import {CloseIconButton} from './CloseIconButton';

describe('CloseIconButton', () => {
  it('renders an icon button with localized close label', () => {
    render(<CloseIconButton />);
    expect(screen.getByRole('button', {name: 'Close'})).toBeInTheDocument();
  });

  it('calls onClick handler when clicked', () => {
    const onClick = vi.fn();
    render(<CloseIconButton onClick={onClick} />);
    fireEvent.click(screen.getByRole('button', {name: 'Close'}));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('can be disabled', () => {
    render(<CloseIconButton disabled />);
    expect(screen.getByRole('button', {name: 'Close'})).toBeDisabled();
  });
});
