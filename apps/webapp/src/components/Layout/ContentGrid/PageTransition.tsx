'use client';

import React from 'react';
import {registerPageTransition} from '@/lib/viewTransitions';

type TPageTransitionProps = React.PropsWithChildren<{transitionKey?: React.Key}>;

export const PageTransition: React.FC<TPageTransitionProps> = ({children, transitionKey}) => (
  <React.ViewTransition
    key={transitionKey}
    enter="auto"
    exit="auto"
    default="none"
    onEnter={registerPageTransition}
    onExit={registerPageTransition}
    onUpdate={registerPageTransition}
  >
    {children}
  </React.ViewTransition>
);
