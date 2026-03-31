import {act, fireEvent, render, screen} from '@testing-library/react';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

import {SearchInput} from './SearchInput';

describe('SearchInput', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('renders a search input', () => {
    render(<SearchInput onSearch={vi.fn()} />);
    expect(screen.getByRole('textbox', {name: 'search'})).toBeInTheDocument();
  });

  it('renders with a custom placeholder', () => {
    render(<SearchInput onSearch={vi.fn()} placeholder="Find something…" />);
    expect(screen.getByPlaceholderText('Find something…')).toBeInTheDocument();
  });

  it('uses default placeholder "Search…"', () => {
    render(<SearchInput onSearch={vi.fn()} />);
    expect(screen.getByPlaceholderText('Search…')).toBeInTheDocument();
  });

  it('shows the clear button after typing', () => {
    render(<SearchInput onSearch={vi.fn()} />);
    const input = screen.getByRole('textbox', {name: 'search'});
    fireEvent.change(input, {target: {value: 'hello'}});
    expect(screen.getByLabelText('clear search')).toBeInTheDocument();
  });

  it('hides the clear button when input is empty', () => {
    render(<SearchInput onSearch={vi.fn()} />);
    expect(screen.queryByLabelText('clear search')).not.toBeInTheDocument();
  });

  it('clears the input and calls onSearch with empty string when clear button is clicked', () => {
    const onSearch = vi.fn();
    render(<SearchInput onSearch={onSearch} debounceWaitInMilliseconds={0} />);
    const input = screen.getByRole('textbox', {name: 'search'});

    fireEvent.change(input, {target: {value: 'test'}});
    fireEvent.click(screen.getByLabelText('clear search'));

    expect(input).toHaveValue('');
    expect(onSearch).toHaveBeenCalledWith('');
  });

  it('calls onSearch with the typed value after debounce', () => {
    const onSearch = vi.fn();
    render(<SearchInput onSearch={onSearch} debounceWaitInMilliseconds={300} />);
    const input = screen.getByRole('textbox', {name: 'search'});

    fireEvent.change(input, {target: {value: 'budget'}});
    expect(onSearch).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(onSearch).toHaveBeenCalledWith('budget');
  });

  it('renders as disabled when disabled prop is true', () => {
    render(<SearchInput onSearch={vi.fn()} disabled />);
    expect(screen.getByRole('textbox', {name: 'search'})).toBeDisabled();
  });

  it('renders as disabled when enabled is false', () => {
    render(<SearchInput onSearch={vi.fn()} enabled={false} />);
    expect(screen.getByRole('textbox', {name: 'search'})).toBeDisabled();
  });

  it('renders with a defaultValue', () => {
    render(<SearchInput onSearch={vi.fn()} defaultValue="initial" />);
    expect(screen.getByRole('textbox', {name: 'search'})).toHaveValue('initial');
  });
});
