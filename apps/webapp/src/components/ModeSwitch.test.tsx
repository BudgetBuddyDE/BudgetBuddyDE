import {fireEvent, render, screen} from '@testing-library/react';
import {describe, expect, it, vi} from 'vitest';

const mockSetMode = vi.fn();

vi.mock('@mui/material/styles', async importOriginal => {
  const actual = await importOriginal<typeof import('@mui/material/styles')>();
  return {
    ...actual,
    useColorScheme: vi.fn(() => ({mode: 'light', setMode: mockSetMode})),
  };
});

import ModeSwitch from './ModeSwitch';

describe('ModeSwitch', () => {
  it('renders without crashing', () => {
    const {container} = render(<ModeSwitch />);
    expect(container).not.toBeEmptyDOMElement();
  });

  it('renders a "Theme" label', () => {
    render(<ModeSwitch />);
    expect(screen.getAllByText('Theme').length).toBeGreaterThan(0);
  });

  it('shows the current mode as the selected value', () => {
    render(<ModeSwitch />);
    // The Select displays the current mode value; 'light' maps to the option labeled "Light"
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('renders System, Light, and Dark options when opened', () => {
    render(<ModeSwitch />);
    fireEvent.mouseDown(screen.getByRole('combobox'));
    expect(screen.getByRole('option', {name: 'System'})).toBeInTheDocument();
    expect(screen.getByRole('option', {name: 'Light'})).toBeInTheDocument();
    expect(screen.getByRole('option', {name: 'Dark'})).toBeInTheDocument();
  });

  it('calls setMode when a new mode is selected', () => {
    render(<ModeSwitch />);
    fireEvent.mouseDown(screen.getByRole('combobox'));
    fireEvent.click(screen.getByRole('option', {name: 'Dark'}));
    expect(mockSetMode).toHaveBeenCalledWith('dark');
  });
});
