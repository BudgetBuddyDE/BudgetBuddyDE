import {useCallback, useEffect, useRef, useState} from 'react';

import {logger} from '@/logger';

function getFullscreenElement(): HTMLElement | null {
  const _document = window.document as any;

  const fullscreenElement =
    _document.fullscreenElement ||
    _document.webkitFullscreenElement ||
    _document.mozFullScreenElement ||
    _document.msFullscreenElement;

  return fullscreenElement;
}

async function exitFullscreen() {
  const _document = window.document as any;

  if (typeof _document.exitFullscreen === 'function') return _document.exitFullscreen();
  if (typeof _document.msExitFullscreen === 'function') return _document.msExitFullscreen();
  if (typeof _document.webkitExitFullscreen === 'function') return _document.webkitExitFullscreen();
  if (typeof _document.mozCancelFullScreen === 'function') return _document.mozCancelFullScreen();

  return null;
}

async function enterFullScreen(element: HTMLElement) {
  const _element = element as any;

  return (
    _element.requestFullscreen?.() ||
    _element.msRequestFullscreen?.() ||
    _element.webkitEnterFullscreen?.() ||
    _element.webkitRequestFullscreen?.() ||
    _element.mozRequestFullscreen?.()
  );
}

const prefixes = ['', 'webkit', 'moz', 'ms'];

function addEvents(
  element: HTMLElement,
  {onFullScreen, onError}: {onFullScreen: (event: Event) => void; onError: (event: Event) => void},
) {
  prefixes.forEach(prefix => {
    element.addEventListener(`${prefix}fullscreenchange`, onFullScreen);
    element.addEventListener(`${prefix}fullscreenerror`, onError);
  });

  return () => {
    prefixes.forEach(prefix => {
      element.removeEventListener(`${prefix}fullscreenchange`, onFullScreen);
      element.removeEventListener(`${prefix}fullscreenerror`, onError);
    });
  };
}

/**
 * Custom React hook that provides functionality for toggling fullscreen mode on an element.
 * @template T - The type of the element to be made fullscreen.
 * @returns An object containing the `ref` to be assigned to the element, `toggle` function to toggle fullscreen mode, and `fullscreen` boolean indicating whether the element is currently in fullscreen mode.
 * @author https://github.com/mantinedev/mantine/blob/master/packages/%40mantine/hooks/src/use-fullscreen/use-fullscreen.ts
 */
export function useFullscreen<T extends HTMLElement = any>() {
  const [fullscreen, setFullscreen] = useState<boolean>(false);

  const _ref = useRef<T>();

  const handleFullscreenChange = useCallback(
    (event: Event) => {
      setFullscreen(event.target === getFullscreenElement());
    },
    [setFullscreen],
  );

  const handleFullscreenError = useCallback(
    (event: Event) => {
      setFullscreen(false);
      logger.error(
        `[@mantine/hooks] use-fullscreen: Error attempting full-screen mode method: ${event} (${event.target})`,
      );
    },
    [setFullscreen],
  );

  const toggle = useCallback(async () => {
    if (!getFullscreenElement()) {
      await enterFullScreen(_ref.current!);
    } else {
      await exitFullscreen();
    }
  }, []);

  const ref = useCallback((element: T | null) => {
    if (element === null) {
      _ref.current = window.document.documentElement as T;
    } else {
      _ref.current = element;
    }
  }, []);

  useEffect(() => {
    if (!_ref.current && window.document) {
      _ref.current = window.document.documentElement as T;
      return addEvents(_ref.current, {
        onFullScreen: handleFullscreenChange,
        onError: handleFullscreenError,
      });
    }

    if (_ref.current) {
      return addEvents(_ref.current, {
        onFullScreen: handleFullscreenChange,
        onError: handleFullscreenError,
      });
    }

    return undefined;
  }, []);

  return {ref, toggle, fullscreen} as const;
}
