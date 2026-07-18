'use client';

import {Button, IconButton, type ButtonProps, type IconButtonProps} from '@mui/material';
import NextLink from 'next/link';
import React from 'react';
import type {Intent} from '@/lib/ibn';
import {buildIntentHref} from '@/lib/ibn';

/** Props for a link that navigates to a serialized intent. */
export type IntentButtonProps =
  | (Omit<ButtonProps<typeof NextLink>, 'href' | 'LinkComponent'> & {intent: Intent; iconButton?: false})
  | (Omit<IconButtonProps<typeof NextLink>, 'href' | 'LinkComponent'> & {intent: Intent; iconButton: true});

/**
 * Renders an intent as an MUI button backed by a Next.js link.
 *
 * Set `iconButton` to render the same intent as an MUI `IconButton`; provide
 * an accessible label and an icon as children in that mode.
 */
export const IntentButton: React.FC<IntentButtonProps> = props => {
  const href = buildIntentHref(props.intent);

  if (props.iconButton) {
    const {intent: _intent, iconButton: _iconButton, ...iconButtonProps} = props;
    return <IconButton href={href} LinkComponent={NextLink} {...iconButtonProps} />;
  }

  const {intent: _intent, iconButton: _iconButton, ...buttonProps} = props;
  return <Button href={href} LinkComponent={NextLink} {...buttonProps} />;
};
