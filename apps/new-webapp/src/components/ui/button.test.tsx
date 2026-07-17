import {fireEvent, render, screen} from '@testing-library/react';
import {describe, expect, it, vi} from 'vitest';
import {Button} from './button';

describe('Button', () => {
  it('renders its public variants and handles activation', () => {
    const onClick = vi.fn();
    render(
      <Button variant="destructive" size="sm" onClick={onClick}>
        Delete
      </Button>,
    );
    const button = screen.getByRole('button', {name: 'Delete'});
    expect(button).toHaveClass('bg-destructive', 'h-8');
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('does not activate while disabled', () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Save
      </Button>,
    );
    fireEvent.click(screen.getByRole('button', {name: 'Save'}));
    expect(onClick).not.toHaveBeenCalled();
  });
});
