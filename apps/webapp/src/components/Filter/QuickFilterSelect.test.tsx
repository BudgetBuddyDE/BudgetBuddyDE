/** @vitest-environment jsdom */

import {fireEvent, render, screen} from '@testing-library/react';
import React from 'react';
import {describe, expect, it, vi} from 'vitest';
import {QuickFilterSelect} from './QuickFilterSelect';

describe('QuickFilterSelect', () => {
  it('renders its options and applies the selected quick filter', () => {
    const onChange = vi.fn();
    render(
      <QuickFilterSelect
        label="Time period"
        resetLabel="All dates"
        value=""
        options={[
          {value: 'today', label: 'Today'},
          {value: 'thisWeek', label: 'This Week'},
        ]}
        onChange={onChange}
      />,
    );

    const select = screen.getByRole('combobox', {name: 'Time period'});
    fireEvent.mouseDown(select);
    fireEvent.click(screen.getByRole('option', {name: 'Today'}));

    expect(onChange).toHaveBeenCalledWith('today');
  });
});
