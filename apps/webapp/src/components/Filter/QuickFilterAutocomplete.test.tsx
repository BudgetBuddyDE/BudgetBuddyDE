/** @vitest-environment jsdom */

import {fireEvent, render, screen} from '@testing-library/react';
import React from 'react';
import {describe, expect, it, vi} from 'vitest';
import {QuickFilterAutocomplete} from './QuickFilterAutocomplete';

describe('QuickFilterAutocomplete', () => {
  it('filters its compact option list without rendering checkboxes', () => {
    render(
      <QuickFilterAutocomplete
        label="Category"
        value={[]}
        options={[
          {id: 'food', label: 'Food'},
          {id: 'rent', label: 'Rent'},
        ]}
        onChange={vi.fn()}
      />,
    );

    const input = screen.getByRole('combobox', {name: 'Category'});
    fireEvent.focus(input);
    fireEvent.change(input, {target: {value: 'foo'}});

    expect(screen.getByRole('option', {name: 'Food'})).toBeTruthy();
    expect(screen.queryByRole('option', {name: 'Rent'})).toBeNull();
    expect(document.querySelector('input[type="checkbox"]')).toBeNull();
  });
});
