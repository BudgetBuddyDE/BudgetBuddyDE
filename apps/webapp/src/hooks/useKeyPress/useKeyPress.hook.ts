import React from 'react';

import {determineOS} from '@/utils';

/**
 * Hook to listen for key presses.
 * @author - https://devtrium.com/posts/how-keyboard-shortcut#what-about-key-combinations
 *
 * @param keys Array of keys to listen for
 * @param callback Callback function to call when key is pressed
 * @param node Node to listen for key presses on
 * @param requireCtrl Whether to require the ctrl key to be pressed
 */
export const useKeyPress = (
  keys: string[],
  callback: (event: KeyboardEvent) => void,
  node: HTMLElement | Document | null = null,
  requireCtrl = false,
) => {
  const callbackRef = React.useRef(callback);

  React.useLayoutEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const handleKeyPress = React.useCallback(
    (event: KeyboardEvent) => {
      if (
        keys.some(
          key =>
            event.key === key && (requireCtrl ? event.ctrlKey || (determineOS() === 'MacOS' && event.metaKey) : true),
        )
      ) {
        callbackRef.current(event);
      }
    },
    [keys],
  );

  React.useEffect(() => {
    const targetNode: Document | (EventTarget & HTMLElement) = node ?? document;

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    targetNode.addEventListener('keydown', handleKeyPress);

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    return () => targetNode.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress, node]);
};
