'use client';

import {Box, Text, createPolymorphicComponent} from '@mantine/core';
import type {PolymorphicComponentProps} from '@mantine/core';
import type {ReactNode} from 'react';
import {Card} from '@/compositions/Cards/Card';
import type {CardProps} from '@/compositions/Cards/Card';
import classes from './StatsCard.module.css';

export interface StatsCardProps extends Omit<CardProps, 'children'> {
  children?: never;
  title: ReactNode;
  value: ReactNode;
  subtitle: ReactNode;
  icon?: ReactNode;
}

export const StatsCard = createPolymorphicComponent<'section', StatsCardProps>(function StatsCard({
  title,
  value,
  subtitle,
  icon,
  className,
  ...props
}: PolymorphicComponentProps<'section', StatsCardProps>) {
  return (
    <Card
      component="section"
      padding="md"
      radius="md"
      withBorder
      {...props}
      className={[classes.root, icon != null && classes.withIcon, className].filter(Boolean).join(' ')}
    >
      <Card.Header pb={0} className={classes.content}>
        <Card.Title order={2} className={classes.title}>
          {title}
        </Card.Title>
      </Card.Header>
      <Card.Body py={4} className={`${classes.body} ${classes.content}`}>
        <Text component="p" className={classes.value}>
          {value}
        </Text>
        {icon != null && (
          <Box className={classes.icon} aria-hidden="true">
            {icon}
          </Box>
        )}
      </Card.Body>
      <Card.Footer pt={0} className={classes.content}>
        <Card.Subtitle className={classes.subtitle}>{subtitle}</Card.Subtitle>
      </Card.Footer>
    </Card>
  );
});
