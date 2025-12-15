'use client';

import React from 'react';

export type Command = {
  id: string;
  label: string;
  shortcut?: string;
  section?: string;
  icon?: React.ReactNode;
  onSelect: () => void;
};

export type CommandPaletteContextValue = {
  open: boolean;
  setOpen: (v: boolean) => void;
  toggle: () => void;
  register: (commands: Command[]) => void;
  unregister: (ids: string[]) => void;
  commands: Command[];
};

const CommandPaletteContext = React.createContext<CommandPaletteContextValue | undefined>(undefined);

export const useCommandPalette = () => {
  const ctx = React.useContext(CommandPaletteContext);
  if (!ctx) throw new Error('useCommandPalette must be used within CommandPaletteProvider');
  return ctx;
};

export const CommandPaletteProvider: React.FC<React.PropsWithChildren> = ({children}) => {
  const [open, setOpen] = React.useState(false);
  const [commands, setCommands] = React.useState<Command[]>([]);

  const toggle = React.useCallback(() => setOpen(v => !v), []);

  const register = React.useCallback((commands: Command[]) => {
    setCommands(prev => {
      const ids = new Set(prev.map(c => c.id));
      const merged = [...prev];
      for (const c of commands) {
        if (!ids.has(c.id)) merged.push(c);
      }
      return merged;
    });
  }, []);

  const unregister = React.useCallback((ids: string[]) => {
    setCommands(prev => prev.filter(c => !ids.includes(c.id)));
  }, []);

  React.useEffect(() => {
    // Global shortcut: Ctrl/Cmd + K
    const onKeyDown = (e: KeyboardEvent) => {
      const isMac = /Mac|iPod|iPhone|iPad/.test(navigator.platform);
      const isCmdPressed = isMac ? e.metaKey : e.ctrlKey;
      const lowerKey = e.key.toLowerCase();
      if (isCmdPressed && lowerKey === 'k') {
        e.preventDefault();
        setOpen(true);
      }
      if (lowerKey === 'escape') setOpen(false);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const contextState: CommandPaletteContextValue = React.useMemo(
    () => ({open, setOpen, toggle, register, unregister, commands}),
    [open, register, unregister, commands, toggle],
  );

  return <CommandPaletteContext.Provider value={contextState}>{children}</CommandPaletteContext.Provider>;
};
