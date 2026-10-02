'use client';

import {ActionIcon, Tooltip, useMantineColorScheme} from '@mantine/core';
import {IconMoon, IconSun} from '@tabler/icons-react';
import classes from './ThemeToggle.module.css';

export function ThemeToggle() {
  const {toggleColorScheme} = useMantineColorScheme();

  return (
    <Tooltip label="Toggle color scheme">
      <ActionIcon
        variant="subtle"
        color="gray"
        size="lg"
        aria-label="Toggle color scheme"
        onClick={() => toggleColorScheme()}
      >
        <IconSun size={22} className={classes.sun} aria-hidden="true" />
        <IconMoon size={22} className={classes.moon} aria-hidden="true" />
      </ActionIcon>
    </Tooltip>
  );
}
