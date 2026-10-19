'use client';

import React from 'react';
import {registerPageTransition} from '@/lib/viewTransitions';

export const PageTransition: React.FC<React.PropsWithChildren> = ({children}) => (
  <React.ViewTransition
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
