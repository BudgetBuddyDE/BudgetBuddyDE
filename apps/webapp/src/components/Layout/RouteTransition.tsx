'use client';

import type React from 'react';
import {ViewTransition} from 'react';

/** Animates authenticated route content while leaving the shared app shell unchanged. */
export function RouteTransition({children}: React.PropsWithChildren) {
  return <ViewTransition default="route-page">{children}</ViewTransition>;
}
