'use client';

import SearchRounded from '@mui/icons-material/SearchRounded';
import {
  Box,
  Dialog,
  DialogContent,
  Divider,
  InputAdornment,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  TextField,
  Typography,
} from '@mui/material';
import React from 'react';
import {NoResults} from '../NoResults';
import {type Command, useCommandPalette} from './CommandPaletteContext';

const commandMatchesQuery = (command: Command, query: string) => {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = [command.label, ...(command.keywords ?? [])].join(' ').toLowerCase();
  return haystack.includes(q);
};

export const CommandPalette: React.FC = () => {
  const {open, setOpen, commands} = useCommandPalette();
  const [query, setQuery] = React.useState('');
  const [selectedIndex, setSelectedIndex] = React.useState(-1);
  const [focusMode, setFocusMode] = React.useState<'input' | 'list'>('input');
  const [resolverCommand, setResolverCommand] = React.useState<Command | null>(null);
  const [resolverResults, setResolverResults] = React.useState<Command[]>([]);
  const [isResolving, setIsResolving] = React.useState(false);
  const resolverRequestRef = React.useRef(0);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const isResolverMode = resolverCommand !== null;

  const filteredCommands = React.useMemo(() => {
    if (isResolverMode) return resolverResults;
    return commands.filter(command => commandMatchesQuery(command, query));
  }, [commands, isResolverMode, query, resolverResults]);

  const groupedCommands = React.useMemo(() => {
    const map = new Map<string, Command[]>();
    for (const c of filteredCommands) {
      const groupName = c.section ?? 'General';
      const groupCommands = map.get(groupName) ?? [];
      groupCommands.push(c);
      map.set(groupName, groupCommands);
    }
    return Array.from(map.entries());
  }, [filteredCommands]);

  const flatCommands = React.useMemo(
    () => filteredCommands.filter(command => command.onSelect || command.resolve),
    [filteredCommands],
  );

  const resetNavigationState = React.useCallback(() => {
    setSelectedIndex(-1);
    setFocusMode('input');
  }, []);

  const exitResolverMode = React.useCallback(() => {
    setResolverCommand(null);
    setResolverResults([]);
    setIsResolving(false);
    setQuery('');
    resetNavigationState();
    inputRef.current?.focus();
  }, [resetNavigationState]);

  const handleSelectCommand = React.useCallback(
    (cmdId: string) => {
      const cmd = flatCommands.find(c => c.id === cmdId);
      if (!cmd) return;

      if (cmd.resolve) {
        setResolverCommand(cmd);
        setResolverResults([]);
        setQuery('');
        resetNavigationState();
        requestAnimationFrame(() => inputRef.current?.focus());
        return;
      }

      if (!cmd.onSelect) return;

      setOpen(false);

      // Execute after close for smoother UX
      setTimeout(() => {
        // Clear search query in order to provide a fresh start when the palette is reopened
        setQuery('');
        setResolverCommand(null);
        setResolverResults([]);
        // Reset navigation state
        resetNavigationState();
        cmd.onSelect?.();
      }, 100);
    },
    [flatCommands, resetNavigationState, setOpen],
  );

  const executeSelectedCommand = React.useCallback(() => {
    if (selectedIndex >= 0 && selectedIndex < flatCommands.length) {
      const cmd = flatCommands[selectedIndex];
      handleSelectCommand(cmd.id);
    }
  }, [flatCommands, handleSelectCommand, selectedIndex]);

  React.useEffect(() => {
    if (!resolverCommand?.resolve) return;

    const requestId = resolverRequestRef.current + 1;
    resolverRequestRef.current = requestId;
    setIsResolving(true);

    Promise.resolve(resolverCommand.resolve(query))
      .then(results => {
        if (resolverRequestRef.current !== requestId) return;
        setResolverResults(results);
      })
      .catch(() => {
        if (resolverRequestRef.current !== requestId) return;
        setResolverResults([]);
      })
      .finally(() => {
        if (resolverRequestRef.current === requestId) setIsResolving(false);
      });
  }, [query, resolverCommand]);

  // Reset selection when filtered commands change
  React.useEffect(() => {
    resetNavigationState();
  }, [filteredCommands, resetNavigationState]);

  // Reset when dialog opens/closes
  React.useEffect(() => {
    if (open) {
      setQuery('');
      setResolverCommand(null);
      setResolverResults([]);
      setIsResolving(false);
      resetNavigationState();
    }
  }, [open, resetNavigationState]);

  React.useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          if (focusMode === 'input') {
            // Move from input to first item
            if (flatCommands.length > 0) {
              setFocusMode('list');
              setSelectedIndex(0);
            }
          } else {
            // Navigate down in list
            setSelectedIndex(prev => (prev < flatCommands.length - 1 ? prev + 1 : prev));
          }
          break;

        case 'ArrowUp':
          e.preventDefault();
          if (focusMode === 'list') {
            if (selectedIndex <= 0) {
              // Move back to input
              setFocusMode('input');
              setSelectedIndex(-1);
              inputRef.current?.focus();
            } else {
              // Navigate up in list
              setSelectedIndex(prev => prev - 1);
            }
          }
          break;

        case 'Enter':
          e.preventDefault();
          if (focusMode === 'list' && selectedIndex >= 0) {
            executeSelectedCommand();
          }
          break;

        case 'Escape':
          e.preventDefault();
          if (isResolverMode) {
            exitResolverMode();
          } else {
            setOpen(false);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    executeSelectedCommand,
    exitResolverMode,
    flatCommands.length,
    focusMode,
    isResolverMode,
    open,
    selectedIndex,
    setOpen,
  ]);

  return (
    <Dialog
      open={open}
      onClose={() => setOpen(false)}
      scroll={'paper'}
      fullWidth
      maxWidth="sm"
      sx={{
        '& .MuiDialog-container': {
          alignItems: 'flex-start',
        },
      }}
    >
      <DialogContent sx={{p: 0}}>
        <Box sx={{p: 2, borderBottom: t => `1px solid ${t.palette.divider}`}}>
          <TextField
            ref={inputRef}
            autoFocus
            fullWidth
            placeholder={isResolverMode ? `Search ${resolverCommand.label.toLowerCase()}` : 'Search an action...'}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => setFocusMode('input')}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRounded />
                  </InputAdornment>
                ),
              },
            }}
          />
        </Box>

        <Box sx={{maxHeight: 400, overflowY: 'auto'}}>
          {isResolving && (
            <List disablePadding>
              <ListItem disablePadding>
                <ListItemButton disabled>
                  <ListItemText primary="Loading..." />
                </ListItemButton>
              </ListItem>
            </List>
          )}
          {!isResolving && groupedCommands.length === 0 && isResolverMode && (
            <List disablePadding>
              <ListItem disablePadding>
                <ListItemButton disabled>
                  <ListItemText primary={resolverCommand.emptyLabel ?? 'No matching targets'} />
                </ListItemButton>
              </ListItem>
            </List>
          )}
          {!isResolving && groupedCommands.length === 0 && !isResolverMode && (
            <NoResults text={`No results for '${query}'!`} sx={{m: 2}} />
          )}
          {!isResolving &&
            groupedCommands.map(([section, items], idx, arr) => (
              <Box key={section}>
                <Typography variant="overline" sx={{px: 2, pt: 1, display: 'block', opacity: 0.7}}>
                  {section}
                </Typography>
                <List disablePadding>
                  {items.map(item => {
                    const itemIndex = flatCommands.findIndex(cmd => cmd.id === item.id);
                    const isSelected = focusMode === 'list' && selectedIndex === itemIndex;

                    return (
                      <ListItem key={item.id} disablePadding>
                        <ListItemButton
                          onClick={() => handleSelectCommand(item.id)}
                          selected={isSelected}
                          sx={{
                            backgroundColor: isSelected ? 'action.selected' : 'transparent',
                            '&:hover': {
                              backgroundColor: 'action.hover',
                            },
                          }}
                        >
                          {item.icon && <ListItemIcon>{item.icon}</ListItemIcon>}
                          <ListItemText primary={item.label} secondary={item.shortcut} />
                        </ListItemButton>
                      </ListItem>
                    );
                  })}
                </List>
                {idx !== arr.length - 1 && <Divider />}
              </Box>
            ))}
        </Box>
      </DialogContent>
    </Dialog>
  );
};
