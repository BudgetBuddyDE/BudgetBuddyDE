import {mock, type AnyMock} from './mock';

/** Shared Better Auth double for tests that only need session lookups. */
export const getSession: AnyMock = mock(async () => null);
export const auth = {api: {getSession}};

export function resetAuthMock(): void {
  getSession.mockReset();
  getSession.mockResolvedValue(null);
}
