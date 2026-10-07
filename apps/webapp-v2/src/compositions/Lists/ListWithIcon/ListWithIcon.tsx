'use client';

import {Box, Group, Image, Text, UnstyledButton} from '@mantine/core';
import type {ReactNode} from 'react';
import classes from './ListWithIcon.module.css';

export interface ListWithIconProps {
  icon?: ReactNode;
  imageUrl?: string;
  title: string;
  subtitle?: string | string[] | ReactNode;
  amount?: string | number | ReactNode;
  onClick?: () => void;
}

function formatAmount(amount: string | number | ReactNode) {
  if (typeof amount === 'number') {
    return new Intl.NumberFormat('de-DE', {style: 'currency', currency: 'EUR', minimumFractionDigits: 2}).format(
      amount,
    );
  }

  return amount;
}

function renderSubtitle(subtitle: ListWithIconProps['subtitle']) {
  if (Array.isArray(subtitle)) {
    return subtitle.map((label, index) => (
      <span className={classes.badge} key={`${label}-${index}`}>
        {label}
      </span>
    ));
  }

  return subtitle;
}

export function ListWithIcon({icon, imageUrl, title, subtitle, amount, onClick}: ListWithIconProps) {
  const content = (
    <>
      <Box className={classes.tile} aria-hidden="true">
        {imageUrl ? <Image src={imageUrl} alt="" className={classes.image} /> : icon}
      </Box>
      <Text fw={700} className={classes.title}>
        {title}
      </Text>
      {amount != null && (
        <Text fw={700} className={classes.amount}>
          {formatAmount(amount)}
        </Text>
      )}
      {subtitle != null && (
        <Group gap={6} className={classes.subtitle}>
          {renderSubtitle(subtitle)}
        </Group>
      )}
    </>
  );

  if (onClick) {
    return (
      <UnstyledButton className={classes.root} onClick={onClick}>
        {content}
      </UnstyledButton>
    );
  }

  return <Box className={classes.root}>{content}</Box>;
}
