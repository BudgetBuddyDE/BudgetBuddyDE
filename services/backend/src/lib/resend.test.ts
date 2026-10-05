import {beforeEach, describe, expect, it, vi} from 'vitest';

const mocks = vi.hoisted(() => ({
  send: vi.fn(),
  config: {runtime: 'development', email: {resendApiKey: 'test-api-key'}},
  create: vi.fn(),
}));
vi.mock('../config', () => ({config: mocks.config}));
vi.mock('resend', () => ({
  Resend: class {
    emails = {send: mocks.send};
    constructor(key: string) {
      mocks.create(key);
    }
  },
}));

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  mocks.config.runtime = 'development';
  mocks.send.mockResolvedValue({data: {id: 'mail-id'}, error: null});
});

describe('Resend mail delivery', () => {
  it.each([
    [
      'sendVerificationEmail',
      ['ada@example.com', 'https://app/verify'],
      'Verify your email address',
      'https://app/verify',
    ],
    [
      'sendChangeEmailRequest',
      ['ada@example.com', 'new@example.com', 'https://app/change'],
      'Confirm change of your email address',
      'new@example.com',
    ],
    ['sendPasswordReset', ['ada@example.com', 'Ada', 'https://app/reset'], 'Reset your password', 'Hey Ada'],
    [
      'sendAccountDeletionVerification',
      ['ada@example.com', 'https://app/delete'],
      'Deletion of your account',
      'https://app/delete',
    ],
  ] as const)('sends %s with correct recipient and returns provider errors', async (method, args, subject, text) => {
    const {resendManager} = await import('./resend');
    const call = resendManager[method] as (...args: readonly string[]) => Promise<unknown>;
    expect(await call.apply(resendManager, [...args])).toEqual([{id: 'mail-id'}, null]);
    expect(mocks.create).toHaveBeenCalledWith('test-api-key');
    expect(mocks.send).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'Acme <onboarding@resend.dev>',
        to: ['ada@example.com'],
        subject,
        html: expect.stringContaining(text),
      }),
    );
    const error = {message: 'Provider failure', name: 'validation_error'};
    mocks.send.mockResolvedValue({data: null, error});
    expect(await call.apply(resendManager, [...args])).toEqual([null, error]);
    mocks.send.mockRejectedValue(new Error('Network failure'));
    await expect(call.apply(resendManager, [...args])).rejects.toThrow('Network failure');
  });

  it('uses the verified production sender', async () => {
    mocks.config.runtime = 'production';
    const {resendManager} = await import('./resend');
    await resendManager.sendVerificationEmail('ada@example.com', 'https://app/verify');
    expect(mocks.send).toHaveBeenCalledWith(expect.objectContaining({from: 'System <auth@mail.budget-buddy.de>'}));
  });
});
