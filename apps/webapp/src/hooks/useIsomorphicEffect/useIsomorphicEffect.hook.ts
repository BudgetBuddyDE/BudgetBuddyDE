import {useEffect, useLayoutEffect} from 'react';

// useLayoutEffect will show warning if used during ssr, e.g. with Next.js
// useIsomorphicEffect removes it by replacing useLayoutEffect with useEffect during ssr
/**
 * A custom hook that provides an isomorphic effect hook based on the environment.
 * If the code is running in a browser environment, it uses `useLayoutEffect`.
 * Otherwise, it uses `useEffect`.
 *
 * @returns The appropriate effect hook based on the environment.
 * @author https://github.com/mantinedev/mantine/blob/master/packages/%40mantine/hooks/src/use-isomorphic-effect/use-isomorphic-effect.ts
 */
export const useIsomorphicEffect = typeof document !== 'undefined' ? useLayoutEffect : useEffect;
