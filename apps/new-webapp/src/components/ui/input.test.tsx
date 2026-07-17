import {fireEvent, render, screen} from '@testing-library/react';
import {describe, expect, it} from 'vitest';
import {Input} from './input';

describe('Input', () => {
  it('forwards accessible input attributes and changes', () => {
    render(<Input aria-label="Amount" defaultValue="12.00" />);
    const input = screen.getByLabelText('Amount');
    fireEvent.change(input, {target: {value: '24.50'}});
    expect(input).toHaveValue('24.50');
  });
});
