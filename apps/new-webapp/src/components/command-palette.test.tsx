import {fireEvent, render, screen} from '@testing-library/react';
import {useState} from 'react';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {CommandPalette} from './command-palette';
const mocks = vi.hoisted(() => ({push: vi.fn()}));
vi.mock('next/navigation', () => ({usePathname: () => '/dashboard', useRouter: () => ({push: mocks.push})}));

function PaletteHarness({onOpenChange}: {onOpenChange: (open: boolean) => void}) {
  const [open, setOpen] = useState(true);
  return (
    <CommandPalette
      open={open}
      onOpenChange={next => {
        setOpen(next);
        onOpenChange(next);
      }}
    />
  );
}

describe('CommandPalette', () => {
  beforeEach(() => vi.clearAllMocks());
  it('supports typed intents, keyboard navigation, execution, and success feedback', () => {
    const onOpenChange = vi.fn();
    render(<PaletteHarness onOpenChange={onOpenChange} />);
    const input = screen.getByLabelText('Command or intent');
    fireEvent.change(input, {target: {value: 'report 2026-07'}});
    fireEvent.keyDown(input, {key: 'ArrowDown'});
    fireEvent.keyDown(input, {key: 'ArrowUp'});
    fireEvent.keyDown(input, {key: 'Enter'});
    expect(mocks.push).toHaveBeenCalledWith('/analytics?period=2026-07');
    expect(screen.getByRole('status')).toHaveTextContent('executed');
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
  it('keeps the palette open and announces execution failures', () => {
    mocks.push.mockImplementation(() => {
      throw new Error('navigation failed');
    });
    render(<CommandPalette open onOpenChange={vi.fn()} />);
    fireEvent.click(screen.getByRole('option', {name: /Open transactions/}));
    expect(screen.getByRole('alert')).toHaveTextContent('could not be executed');
  });
  it('hides commands unavailable on the current route', () => {
    render(<CommandPalette open onOpenChange={vi.fn()} />);
    expect(screen.queryByRole('option', {name: /Open dashboard/})).not.toBeInTheDocument();
  });
});
