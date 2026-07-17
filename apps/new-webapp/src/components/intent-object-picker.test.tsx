import {fireEvent, render, screen} from '@testing-library/react';
import {describe, expect, it, vi} from 'vitest';
import {IntentObjectPicker} from './intent-object-picker';

describe('IntentObjectPicker', () => {
  it('requires explicit selection for ambiguous object matches', () => {
    const onSelect = vi.fn();
    render(
      <IntentObjectPicker
        open
        title="Choose transaction"
        options={[
          {id: '1', label: 'Rent', description: 'June'},
          {id: '2', label: 'Rent', description: 'July'},
        ]}
        onSelect={onSelect}
        onClose={() => undefined}
      />,
    );
    expect(screen.getByRole('dialog', {name: 'Choose transaction'})).toHaveTextContent('Select exactly one');
    fireEvent.click(screen.getByRole('button', {name: /Rent July/}));
    expect(onSelect).toHaveBeenCalledWith('2');
  });
});
