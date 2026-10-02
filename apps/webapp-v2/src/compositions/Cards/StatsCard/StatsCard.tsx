import {Box, Card, Text} from '@mantine/core';
import type {ReactNode} from 'react';
import classes from './StatsCard.module.css';

export interface StatsCardProps {
  title: ReactNode;
  value: ReactNode;
  subtitle: ReactNode;
  icon?: ReactNode;
}

export function StatsCard({title, value, subtitle, icon}: StatsCardProps) {
  return (
    <Card component="section" className={classes.root} radius="xl" p="lg">
      <Text component="h2" className={classes.title}>
        {title}
      </Text>
      <Text component="p" className={classes.value}>
        {value}
      </Text>
      <Text component="p" className={classes.subtitle}>
        {subtitle}
      </Text>
      {icon && (
        <Box className={classes.icon} aria-hidden="true">
          {icon}
        </Box>
      )}
    </Card>
  );
}
