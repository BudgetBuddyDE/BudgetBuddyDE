import '@testing-library/jest-dom/vitest';
import {afterEach, vi} from 'vitest';
import {cleanup} from '@testing-library/react';
import {createElement, type ImgHTMLAttributes} from 'react';

afterEach(() => cleanup());

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

vi.mock('next/image', () => ({
  default: (props: ImgHTMLAttributes<HTMLImageElement> & {fill?: boolean; unoptimized?: boolean}) => {
    const imageProps = {...props};
    delete imageProps.fill;
    delete imageProps.unoptimized;
    return createElement('img', imageProps);
  },
}));

vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
  useRouter: () => ({push: vi.fn(), replace: vi.fn(), refresh: vi.fn()}),
  useSearchParams: () => new URLSearchParams(),
  redirect: vi.fn(),
}));
