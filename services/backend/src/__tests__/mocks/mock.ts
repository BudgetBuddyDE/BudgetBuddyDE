import {vi, type Mock} from 'vite-plus/test';

/** Permissive function type for shared doubles configured by individual tests. */
export type AnyFn = (...args: any[]) => any;
export type AnyMock = Mock<AnyFn>;

/** Creates a mock whose parameters and result stay configurable per test. */
export function mock<T extends AnyFn = AnyFn>(implementation?: T): Mock<T> {
  return vi.fn(implementation) as Mock<T>;
}
