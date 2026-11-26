import {vi} from 'vite-plus/test';

/**
 * Shared Better Auth client double. Only suites that need to assert against
 * the client configure these functions; every other suite gets inert stubs so
 * importing the real client never touches the network in unit tests.
 */
export const authClient = {
  useSession: vi.fn(),
  getSession: vi.fn(),
  signIn: {email: vi.fn(), social: vi.fn()},
  signUp: {email: vi.fn()},
  signOut: vi.fn(),
  changeEmail: vi.fn(),
  deleteUser: vi.fn(),
  listAccounts: vi.fn(),
  listSessions: vi.fn(),
  requestPasswordReset: vi.fn(),
  resetPassword: vi.fn(),
  revokeSession: vi.fn(),
  revokeSessions: vi.fn(),
  sendVerificationEmail: vi.fn(),
  unlinkAccount: vi.fn(),
  updateUser: vi.fn(),
  apiKey: {
    list: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
  },
};

export const signOut = vi.fn();
export const revalidateSession = vi.fn();

function resetNested(value: unknown): void {
  if (typeof value === 'function' && 'mockReset' in value) {
    (value as ReturnType<typeof vi.fn>).mockReset();
    return;
  }
  if (value && typeof value === 'object') {
    for (const nested of Object.values(value)) resetNested(nested);
  }
}

/** Restores inert client defaults before every test. */
export function resetAuthClientMock(): void {
  resetNested(authClient);
  signOut.mockReset();
  revalidateSession.mockReset();
  authClient.useSession.mockReturnValue({isPending: false, data: null} as never);
}
