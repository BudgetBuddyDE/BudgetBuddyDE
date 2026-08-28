/** @vitest-environment jsdom */

import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import React from 'react';
import {describe, expect, it, vi} from 'vitest';
import {Autocomplete} from './Autocomplete';

describe('Autocomplete', () => {
  it('supports local options without a search filter', async () => {
    render(
      <Autocomplete<{id: string; name: string}, true>
        name="categories"
        label="Category"
        multiple
        searchAsYouType={false}
        retrieveOptionsFunc={() => [
          {id: 'food', name: 'Food'},
          {id: 'rent', name: 'Rent'},
        ]}
        value={[]}
        onChange={vi.fn()}
        getOptionLabel={option => option.name}
        isOptionEqualToValue={(option, value) => option.id === value.id}
      />,
    );

    fireEvent.click(screen.getByRole('button', {name: 'Open'}));

    await waitFor(() => expect(screen.getByRole('option', {name: 'Food'})).toBeTruthy());
    expect(screen.getByRole('option', {name: 'Rent'})).toBeTruthy();
  });

  it('supports resetting a static selection', async () => {
    const onChange = vi.fn();
    render(
      <Autocomplete
        name="time-period"
        label="Time period"
        searchAsYouType={false}
        retrieveOptionsFunc={() => ['today', 'thisWeek']}
        value="today"
        onChange={onChange}
        getOptionLabel={option => (option === 'today' ? 'Today' : 'This Week')}
      />,
    );

    fireEvent.click(screen.getByTitle('Clear'));

    expect(onChange).toHaveBeenCalledWith(expect.anything(), null, 'clear', undefined);
  });
});
