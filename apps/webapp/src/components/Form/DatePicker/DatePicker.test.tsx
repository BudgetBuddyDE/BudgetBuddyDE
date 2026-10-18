import {fireEvent, render, screen} from '@testing-library/react';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {DatePicker} from './DatePicker';

const {useOptionalPreferencesContext} = vi.hoisted(() => ({useOptionalPreferencesContext: vi.fn()}));
vi.mock('@/hooks/usePreferences', () => ({useOptionalPreferencesContext}));

describe('DatePicker', () => {
  beforeEach(() => useOptionalPreferencesContext.mockReturnValue(null));

  it('defaults to English on public pages and switches date-fns and MUI labels to German', () => {
    const props = {label: 'Date', value: new Date(2026, 2, 15), format: 'MMMM yyyy'};
    const {rerender} = render(<DatePicker {...props} />);
    expect(screen.getByRole('spinbutton', {name: 'Month'})).toHaveTextContent('March');
    expect(screen.getByRole('button', {name: /Choose date/})).toBeInTheDocument();

    useOptionalPreferencesContext.mockReturnValue({locale: 'de-DE'});
    rerender(<DatePicker {...props} />);
    expect(screen.getByRole('spinbutton', {name: 'Monat'})).toHaveTextContent('März');
    fireEvent.click(screen.getByRole('button', {name: /Datum auswählen/}));
    expect(screen.getByRole('button', {name: 'Letzter Monat'})).toBeInTheDocument();
  });

  it('preserves date-only values and the explicit day-month-year format when switching locale', () => {
    const onChange = vi.fn();
    const props = {label: 'Date', value: new Date(2026, 2, 29), onChange};
    const {container, rerender} = render(<DatePicker {...props} />);
    expect(container.querySelector('input')).toHaveValue('29.03.2026');
    useOptionalPreferencesContext.mockReturnValue({locale: 'de-DE'});
    rerender(<DatePicker {...props} />);
    expect(container.querySelector('input')).toHaveValue('29.03.2026');
    expect(onChange).not.toHaveBeenCalled();
  });
});
