'use client';

import {Button, type ButtonProps} from '@mui/material';
import NextLink from 'next/link';
import type React from 'react';

export type LinkButtonProps = Omit<ButtonProps, 'href' | 'LinkComponent'> & {href: string};

export const LinkButton: React.FC<LinkButtonProps> = props => <Button LinkComponent={NextLink} {...props} />;
