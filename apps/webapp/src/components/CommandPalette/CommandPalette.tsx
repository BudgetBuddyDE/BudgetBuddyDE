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

const SECTION_ORDER: Record<string, number> = {
  Navigation: 0,
  Actions: 1,
  Settings: 2,
  Session: 3,
};

export const CommandPalette: React.FC = () => {
  const {open, setOpen, commands} = useCommandPalette();
  const [query, setQuery] = React.useState('');
  const [selectedIndex, setSelectedIndex] = React.useState(-1);
  const [focusMode, setFocusMode] = React.useState<'input' | 'list'>('input');
  const [levels, setLevels] = React.useState<Array<{label: string; commands: Command[]}>>([]);
  const [activeCommand, setActiveCommand] = React.useState<Command | null>(null);
  const [resolvedCommands, setResolvedCommands] = React.useState<Command[]>([]);
  const [isResolving, setIsResolving] = React.useState(false);
  const requestRef = React.useRef(0);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const currentCommands = levels.at(-1)?.commands ?? commands;
  const isResolverMode = activeCommand !== null;
  const filteredCommands = React.useMemo(() => {
    if (isResolverMode) return resolvedCommands;
    return currentCommands.filter(command => commandMatchesQuery(command, query));
  }, [currentCommands, isResolverMode, query, resolvedCommands]);
  const groupedCommands = React.useMemo(() => {
    const groups = new Map<string, Command[]>();
    for (const command of filteredCommands) {
      const section = command.section ?? 'General';
      const group = groups.get(section) ?? [];
      group.push(command);
      groups.set(section, group);
    }
    return Array.from(groups.entries()).sort(
      ([firstSection], [secondSection]) =>
        (SECTION_ORDER[firstSection] ?? Number.MAX_SAFE_INTEGER) -
        (SECTION_ORDER[secondSection] ?? Number.MAX_SAFE_INTEGER),
    );
  }, [filteredCommands]);
  const flatCommands = filteredCommands.filter(command => command.onSelect || command.resolve || command.children);

  const resetNavigation = React.useCallback(() => {
    setSelectedIndex(-1);
    setFocusMode('input');
  }, []);
  const resetFlow = React.useCallback(() => {
    setLevels([]);
    setActiveCommand(null);
    setResolvedCommands([]);
    setQuery('');
    resetNavigation();
  }, [resetNavigation]);
  const goBack = React.useCallback(() => {
    if (activeCommand) {
      setActiveCommand(null);
      setResolvedCommands([]);
    } else if (levels.length) {
      setLevels(previous => previous.slice(0, -1));
    } else {
      setOpen(false);
    }
    setQuery('');
    resetNavigation();
    requestAnimationFrame(() => inputRef.current?.focus());
  }, [activeCommand, levels.length, resetNavigation, setOpen]);

  const selectCommand = React.useCallback(
    (id: string) => {
      const command = flatCommands.find(item => item.id === id);
      if (!command) return;
      if (command.children) {
        setLevels(previous => [...previous, {label: command.label, commands: command.children ?? []}]);
        setQuery('');
        resetNavigation();
        requestAnimationFrame(() => inputRef.current?.focus());
        return;
      }
      if (command.resolve) {
        setActiveCommand(command);
        setResolvedCommands([]);
        setQuery('');
        resetNavigation();
        requestAnimationFrame(() => inputRef.current?.focus());
        return;
      }
      if (!command.onSelect) return;
      setOpen(false);
      setTimeout(() => {
        resetFlow();
        void command.onSelect?.();
      }, 100);
    },
    [flatCommands, resetFlow, resetNavigation, setOpen],
  );
  const executeSelected = React.useCallback(() => {
    if (focusMode === 'list' && selectedIndex >= 0) selectCommand(flatCommands[selectedIndex]?.id ?? '');
  }, [flatCommands, focusMode, selectCommand, selectedIndex]);

  React.useEffect(() => {
    if (!activeCommand?.resolve) return;
    const requestId = ++requestRef.current;
    setIsResolving(true);
    Promise.resolve(activeCommand.resolve(query))
      .then(results => {
        if (requestRef.current === requestId) setResolvedCommands(results);
      })
      .catch(() => {
        if (requestRef.current === requestId) setResolvedCommands([]);
      })
      .finally(() => {
        if (requestRef.current === requestId) setIsResolving(false);
      });
  }, [activeCommand, query]);

  React.useEffect(() => resetNavigation(), [filteredCommands, resetNavigation]);
  React.useEffect(() => {
    if (!open) resetFlow();
  }, [open, resetFlow]);
  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Backspace' && !query && (levels.length > 0 || activeCommand)) {
        event.preventDefault();
        goBack();
        return;
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        goBack();
        return;
      }
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        if (focusMode === 'input' && flatCommands.length) {
          setFocusMode('list');
          setSelectedIndex(0);
        } else setSelectedIndex(index => Math.min(index + 1, flatCommands.length - 1));
      } else if (event.key === 'ArrowUp' && focusMode === 'list') {
        event.preventDefault();
        if (selectedIndex <= 0) {
          setFocusMode('input');
          setSelectedIndex(-1);
          inputRef.current?.focus();
        } else setSelectedIndex(index => index - 1);
      } else if (event.key === 'Enter') {
        event.preventDefault();
        executeSelected();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    activeCommand,
    executeSelected,
    flatCommands.length,
    focusMode,
    goBack,
    levels.length,
    open,
    query,
    selectedIndex,
  ]);

  const title = levels.length ? 'Choose entity' : activeCommand ? activeCommand.label : 'Commands';
  const placeholder =
    activeCommand?.placeholder ??
    (activeCommand
      ? `Search ${activeCommand.label.toLowerCase()}`
      : levels.length
        ? 'Search entity...'
        : 'Search commands...');
  const breadcrumb = [...levels.map(level => level.label), activeCommand?.label].filter(Boolean).join('  ›  ');

  return (
    <Dialog
      open={open}
      onClose={() => setOpen(false)}
      scroll="paper"
      fullWidth
      maxWidth="sm"
      slotProps={{paper: {elevation: 0}}}
      sx={{'& .MuiDialog-container': {alignItems: 'center'}}}
    >
      <DialogContent sx={{p: 0}}>
        <Box sx={{p: 2, borderBottom: t => `1px solid ${t.palette.divider}`}}>
          <Typography variant="caption" sx={{display: 'block', mb: 1, opacity: 0.7}}>
            {breadcrumb || title}
          </Typography>
          <TextField
            ref={inputRef}
            autoFocus
            fullWidth
            placeholder={placeholder}
            value={query}
            onChange={event => setQuery(event.target.value)}
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
            <List dense disablePadding>
              <ListItem disablePadding>
                <ListItemButton disabled>
                  <ListItemText primary="Loading..." />
                </ListItemButton>
              </ListItem>
            </List>
          )}
          {!isResolving && !groupedCommands.length && isResolverMode && (
            <List dense disablePadding>
              <ListItem disablePadding>
                <ListItemButton disabled>
                  <ListItemText primary={activeCommand.emptyLabel ?? 'No matching records'} />
                </ListItemButton>
              </ListItem>
            </List>
          )}
          {!isResolving && !groupedCommands.length && !isResolverMode && (
            <NoResults text={`No results for '${query}'!`} sx={{m: 2}} />
          )}
          {!isResolving &&
            groupedCommands.map(([section, items], groupIndex) => (
              <Box key={section}>
                <Typography variant="overline" sx={{px: 2, pt: 1, display: 'block', opacity: 0.7}}>
                  {section}
                </Typography>
                <List dense disablePadding>
                  {items.map(item => {
                    const itemIndex = flatCommands.findIndex(command => command.id === item.id);
                    const selected = focusMode === 'list' && selectedIndex === itemIndex;
                    return (
                      <ListItem key={item.id} disablePadding>
                        <ListItemButton
                          onClick={() => selectCommand(item.id)}
                          selected={selected}
                          sx={{
                            backgroundColor: selected ? 'action.selected' : 'transparent',
                            '&:hover': {backgroundColor: 'action.hover'},
                          }}
                        >
                          {item.icon && <ListItemIcon>{item.icon}</ListItemIcon>}
                          <ListItemText primary={item.label} secondary={item.shortcut} />
                        </ListItemButton>
                      </ListItem>
                    );
                  })}
                </List>
                {groupIndex !== groupedCommands.length - 1 && <Divider />}
              </Box>
            ))}
        </Box>
        <Box
          component="footer"
          aria-label="Keyboard shortcuts"
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 1.5,
            alignItems: 'center',
            px: 2,
            py: 1.25,
            borderTop: t => `1px solid ${t.palette.divider}`,
            color: 'text.secondary',
            typography: 'caption',
          }}
        >
          {[
            ['↑↓', 'Navigate'],
            ['↵', 'Select'],
            ['Esc', 'Back'],
            ['⌫', 'Back'],
          ].map(([key, label]) => (
            <Box key={`${key}-${label}`} component="span" sx={{display: 'inline-flex', alignItems: 'center', gap: 0.5}}>
              <Box
                component="kbd"
                sx={{
                  minWidth: key.length > 1 ? '2.25rem' : '1.5rem',
                  px: 0.5,
                  py: 0.125,
                  border: t => `1px solid ${t.palette.divider}`,
                  borderRadius: 0.75,
                  backgroundColor: 'action.hover',
                  fontFamily: 'inherit',
                  textAlign: 'center',
                  lineHeight: 1.4,
                }}
              >
                {key}
              </Box>
              <Box component="span">{label}</Box>
            </Box>
          ))}
        </Box>
      </DialogContent>
    </Dialog>
  );
};
