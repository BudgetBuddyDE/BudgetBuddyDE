import '@testing-library/jest-dom/vitest';
import {vi} from 'vitest';

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/'),
  useRouter: vi.fn(() => ({push: vi.fn(), replace: vi.fn(), back: vi.fn()})),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));
