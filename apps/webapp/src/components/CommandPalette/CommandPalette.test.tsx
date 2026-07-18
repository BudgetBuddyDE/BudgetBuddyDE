import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import React from 'react';
import {describe, expect, it, vi} from 'vitest';
import {CommandPalette} from './CommandPalette';
import {type Command, CommandPaletteProvider, useCommandPalette} from './CommandPaletteContext';

vi.mock('@mui/icons-material', () => ({
  SearchRounded: () => null,
}));

vi.mock('../NoResults', () => ({
  NoResults: ({text}: {text: string}) => <div>{text}</div>,
}));

const RegisterCommands: React.FC<{commands: Command[]}> = ({commands}) => {
  const {register, unregister, setOpen} = useCommandPalette();

  React.useEffect(() => {
    register(commands);
    setOpen(true);
    return () => unregister(commands.map(command => command.id));
  }, [commands, register, setOpen, unregister]);

  return null;
};

const renderPalette = (commands: Command[]) =>
  render(
    <CommandPaletteProvider>
      <RegisterCommands commands={commands} />
      <CommandPalette />
    </CommandPaletteProvider>,
  );

describe('CommandPalette', () => {
  it('finds top-level commands through keywords', async () => {
    renderPalette([{id: 'open-ledger', label: 'Open Ledger', keywords: ['transactions'], onSelect: vi.fn()}]);

    fireEvent.change(await screen.findByPlaceholderText('Search an action...'), {target: {value: 'transactions'}});

    expect(screen.getByText('Open Ledger')).toBeInTheDocument();
  });

  it('keeps resolver commands open, shows results, and only executes leaf commands', async () => {
    const leafSelect = vi.fn();
    const resolve = vi.fn(
      async (query: string): Promise<Command[]> => [
        {id: 'target-1', label: `Target ${query}`, section: 'Targets', onSelect: leafSelect},
      ],
    );

    renderPalette([{id: 'edit-target', label: 'Edit Target...', resolve}]);

    fireEvent.click(await screen.findByText('Edit Target...'));
    const input = screen.getByPlaceholderText('Search edit target...');
    fireEvent.change(input, {target: {value: 'alpha'}});

    await waitFor(() => expect(screen.getByText('Target alpha')).toBeInTheDocument());
    expect(leafSelect).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Target alpha'));

    await waitFor(() => expect(leafSelect).toHaveBeenCalledTimes(1));
  });

  it('returns from resolver mode to top-level commands on Escape', async () => {
    const resolve = vi.fn(
      async (): Promise<Command[]> => [{id: 'target-1', label: 'Target One', section: 'Targets', onSelect: vi.fn()}],
    );

    renderPalette([{id: 'edit-target', label: 'Edit Target...', resolve}]);

    fireEvent.click(await screen.findByText('Edit Target...'));
    await waitFor(() => expect(screen.getByText('Target One')).toBeInTheDocument());

    fireEvent.keyDown(window, {key: 'Escape'});

    expect(screen.getByText('Edit Target...')).toBeInTheDocument();
    expect(screen.queryByText('Target One')).not.toBeInTheDocument();
  });
});
