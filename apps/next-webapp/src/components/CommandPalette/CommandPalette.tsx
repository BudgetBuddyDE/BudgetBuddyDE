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

  const handleSelectCommand = (cmdId: string) => {
    const cmd = commands.find((c) => c.id === cmdId);
    if (!cmd) return;
    setOpen(false);
    // Clear search query in order to provide a fresh start when the palette is reopened
    setQuery('');
    // Execute after close for smoother UX
    setTimeout(() => cmd.onSelect(), 50);
  };

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
            autoFocus
            fullWidth
            placeholder="Search an action..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
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
                {items.map((item) => (
                  <ListItem key={item.id} disablePadding>
                    <ListItemButton onClick={() => handleSelectCommand(item.id)}>
                      {item.icon && <ListItemIcon>{item.icon}</ListItemIcon>}
                      <ListItemText primary={item.label} secondary={item.shortcut} />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
              {idx !== arr.length - 1 && <Divider />}
            </Box>
          ))}
        </Box>
      </DialogContent>
    </Dialog>
  );
};
