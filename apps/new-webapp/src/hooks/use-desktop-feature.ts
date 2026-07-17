'use client';

import {useEffect, useState} from 'react';

const DESKTOP_QUERY = '(min-width: 1024px)';

export function useDesktopFeature(): boolean {
  const [supported, setSupported] = useState(false);
  useEffect(() => {
    const media = window.matchMedia(DESKTOP_QUERY);
    const update = () => setSupported(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  return supported;
}
