import {vi} from 'vite-plus/test';

/**
 * Shared Next.js navigation doubles. The exported hooks are stable `vi.fn`
 * wrappers so suites can either mutate `navigationMock` or override a single
 * hook with `vi.mocked(useSearchParams).mockReturnValue(...)`.
 */
export const navigationMock = {
  pathname: '/',
  params: new URLSearchParams(),
  router: {
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  },
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
};

export const usePathname = vi.fn(() => navigationMock.pathname);
export const useSearchParams = vi.fn(() => navigationMock.params);
export const useRouter = vi.fn(() => navigationMock.router);
export const notFound = vi.fn(() => navigationMock.notFound());
export const redirect = vi.fn((url: string) => navigationMock.redirect(url));

/** Restores default navigation behavior. Called before every test. */
export function resetNavigationMock(): void {
  navigationMock.pathname = '/';
  navigationMock.params = new URLSearchParams();
  for (const fn of Object.values(navigationMock.router)) fn.mockReset();
  navigationMock.notFound.mockReset().mockImplementation(() => {
    throw new Error('NEXT_NOT_FOUND');
  });
  navigationMock.redirect.mockReset().mockImplementation((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  });
  usePathname.mockReset().mockImplementation(() => navigationMock.pathname);
  useSearchParams.mockReset().mockImplementation(() => navigationMock.params);
  useRouter.mockReset().mockImplementation(() => navigationMock.router);
  notFound.mockReset().mockImplementation(() => navigationMock.notFound());
  redirect.mockReset().mockImplementation((url: string) => navigationMock.redirect(url));
}
