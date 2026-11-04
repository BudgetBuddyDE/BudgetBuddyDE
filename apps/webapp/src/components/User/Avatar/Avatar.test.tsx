import {render, screen, waitFor} from '@testing-library/react';
import {beforeEach, describe, expect, it, vi} from 'vite-plus/test';
import {authClient} from '@/authClient';
import {Avatar} from './Avatar';

vi.mock('@/authClient', () => ({
  authClient: {
    useSession: vi.fn(),
  },
}));

describe('Avatar', () => {
  beforeEach(() => {
    vi.mocked(authClient.useSession).mockReturnValue({
      isPending: false,
      data: {user: {id: 'user/123', image: null}},
    } as ReturnType<typeof authClient.useSession>);
  });

  it('uses the user ID as the generated avatar seed', async () => {
    render(<Avatar />);

    await waitFor(() => {
      expect(screen.getByRole('img')).toHaveAttribute('src', '/api/avatar?seed=user%2F123');
    });
  });

  it('uses a configured user image instead of a generated avatar', async () => {
    vi.mocked(authClient.useSession).mockReturnValue({
      isPending: false,
      data: {user: {id: 'user/123', image: 'https://example.com/avatar.png'}},
    } as ReturnType<typeof authClient.useSession>);

    render(<Avatar />);

    await waitFor(() => {
      expect(screen.getByRole('img')).toHaveAttribute('src', 'https://example.com/avatar.png');
    });
  });
});
