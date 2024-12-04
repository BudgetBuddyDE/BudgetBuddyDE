import {fireEvent, render, screen} from '@testing-library/react';

import {SELECT_DATA_OPTIONS, SelectData} from './SelectData.component';

describe('SelectData', () => {
  it('renders all options', () => {
    const mockOnChange = vi.fn();
    render(<SelectData value={SELECT_DATA_OPTIONS[0].value} onChange={mockOnChange} />);

    SELECT_DATA_OPTIONS.forEach(option => {
      expect(screen.getByText(option.label)).toBeInTheDocument();
    });
  });

  it('calls onChange with the correct value when an option is clicked', () => {
    const mockOnChange = vi.fn();
    render(<SelectData value={SELECT_DATA_OPTIONS[0].value} onChange={mockOnChange} />);

    const option = screen.getByText(SELECT_DATA_OPTIONS[1].label);
    fireEvent.click(option);

    expect(mockOnChange).toHaveBeenCalledWith(SELECT_DATA_OPTIONS[1].value);
  });

  it('displays the correct selected value', () => {
    const mockOnChange = vi.fn();
    render(<SelectData value={SELECT_DATA_OPTIONS[1].value} onChange={mockOnChange} />);

    const selectedOption = screen.getByRole('button', {pressed: true});
    expect(selectedOption).toHaveTextContent(SELECT_DATA_OPTIONS[1].label);
  });
});
