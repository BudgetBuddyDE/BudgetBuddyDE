'use client';

import {Button, type ButtonProps} from '@mui/material';
import NextLink from 'next/link';
import React from 'react';
import type {Intent} from '@/lib/ibn';
import {buildIntentHref} from '@/lib/ibn';

export type IntentButtonProps = Omit<ButtonProps<typeof NextLink>, 'href' | 'LinkComponent'> & {intent: Intent};

export const IntentButton: React.FC<IntentButtonProps> = ({intent, ...props}) => {
  return <Button href={buildIntentHref(intent)} LinkComponent={NextLink} {...props} />;
};
