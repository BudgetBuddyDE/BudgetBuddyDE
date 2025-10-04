'use client';

import React from 'react';
import {
  Box,
  Dialog,
  DialogContent,
  InputAdornment,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  TextField,
  Typography,
  Divider,
} from '@mui/material';
import { SearchRounded } from '@mui/icons-material';
import { useCommandPalette } from './CommandPaletteContext';
import { NoResults } from '../NoResults';

export const CommandPalette: React.FC = () => {
  const { open, setOpen, commands } = useCommandPalette();
  const [query, setQuery] = React.useState('');
  const [selectedIndex, setSelectedIndex] = React.useState(-1);
  const [focusMode, setFocusMode] = React.useState<'input' | 'list'>('input');
  const inputRef = React.useRef<HTMLInputElement>(null);

  const filteredCommands = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter((c) => c.label.toLowerCase().includes(q));
  }, [commands, query]);

  const groupedCommands = React.useMemo(() => {
    const map = new Map<string, typeof filteredCommands>();
    for (const c of filteredCommands) {
      const groupName = c.section ?? 'General';
      const groupCommands = map.get(groupName) ?? [];
      groupCommands.push(c);
      map.set(groupName, groupCommands);
    }
    return Array.from(map.entries());
  }, [filteredCommands]);

  const flatCommands = React.useMemo(() => {
    return filteredCommands;
  }, [filteredCommands]);

  const handleSelectCommand = (cmdId: string) => {
    const cmd = commands.find((c) => c.id === cmdId);
    if (!cmd) return;
    setOpen(false);

    // Execute after close for smoother UX
    setTimeout(() => {
      // Clear search query in order to provide a fresh start when the palette is reopened
      setQuery('');
      // Reset navigation state
      setSelectedIndex(-1);
      setFocusMode('input');
      cmd.onSelect();
    }, 100);
  };

  const executeSelectedCommand = () => {
    if (selectedIndex >= 0 && selectedIndex < flatCommands.length) {
      const cmd = flatCommands[selectedIndex];
      handleSelectCommand(cmd.id);
    }
  };

  // Reset selection when filtered commands change
  React.useEffect(() => {
    setSelectedIndex(-1);
    setFocusMode('input');
  }, [filteredCommands]);

  // Reset when dialog opens/closes
  React.useEffect(() => {
    if (open) {
      setSelectedIndex(-1);
      setFocusMode('input');
      setQuery('');
    }
  }, [open]);

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
            setSelectedIndex((prev) => (prev < flatCommands.length - 1 ? prev + 1 : prev));
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
              setSelectedIndex((prev) => prev - 1);
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
          setOpen(false);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, focusMode, selectedIndex, flatCommands, setOpen]);

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
      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ p: 2, borderBottom: (t) => `1px solid ${t.palette.divider}` }}>
          <TextField
            ref={inputRef}
            autoFocus
            fullWidth
            placeholder="Search an action..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
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

        <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
          {groupedCommands.length === 0 && (
            <NoResults text={`No results for '${query}'!`} sx={{ m: 2 }} />
          )}
          {groupedCommands.map(([section, items], idx, arr) => (
            <Box key={section}>
              <Typography variant="overline" sx={{ px: 2, pt: 1, display: 'block', opacity: 0.7 }}>
                {section}
              </Typography>
              <List disablePadding>
                {items.map((item) => {
                  const itemIndex = flatCommands.findIndex((cmd) => cmd.id === item.id);
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
