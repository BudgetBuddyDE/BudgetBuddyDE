import {fireEvent, render, screen, waitFor} from '@testing-library/react';
import {beforeEach, describe, expect, it, vi} from 'vitest';
import {ProfileSettings} from './profile-settings';
const mocks = vi.hoisted(() => ({
  updateUser: vi.fn(),
  changeEmail: vi.fn(),
  changePassword: vi.fn(),
  deleteUser: vi.fn(),
  push: vi.fn(),
  refresh: vi.fn(),
}));
vi.mock('@/authClient', () => ({authClient: mocks}));
vi.mock('next/navigation', () => ({useRouter: () => ({push: mocks.push, refresh: mocks.refresh})}));

describe('ProfileSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    for (const mock of [mocks.updateUser, mocks.changeEmail, mocks.changePassword, mocks.deleteUser])
      mock.mockResolvedValue({error: null});
  });
  it('updates profile and starts verified email change', async () => {
    render(<ProfileSettings name="Ada" email="ada@example.com" />);
    fireEvent.change(screen.getByLabelText('Profile name'), {target: {value: 'Ada Lovelace'}});
    fireEvent.change(screen.getByLabelText('Profile email'), {target: {value: 'new@example.com'}});
    fireEvent.submit(screen.getByRole('button', {name: 'Save profile'}).closest('form')!);
    await waitFor(() => expect(mocks.updateUser).toHaveBeenCalledWith({name: 'Ada Lovelace'}));
    expect(mocks.changeEmail).toHaveBeenCalledWith(expect.objectContaining({newEmail: 'new@example.com'}));
  });
  it('changes password and revokes other sessions', async () => {
    render(<ProfileSettings name="Ada" email="ada@example.com" />);
    fireEvent.change(screen.getByLabelText('Current password'), {target: {value: 'old-password'}});
    fireEvent.change(screen.getByLabelText('New password'), {target: {value: 'new-password'}});
    fireEvent.submit(screen.getByRole('button', {name: 'Change password'}).closest('form')!);
    await waitFor(() =>
      expect(mocks.changePassword).toHaveBeenCalledWith({
        currentPassword: 'old-password',
        newPassword: 'new-password',
        revokeOtherSessions: true,
      }),
    );
  });
  it('requires destructive confirmation before deleting the account', async () => {
    render(<ProfileSettings name="Ada" email="ada@example.com" />);
    fireEvent.click(screen.getByRole('button', {name: 'Delete account'}));
    fireEvent.change(screen.getByLabelText('Deletion password'), {target: {value: 'password'}});
    fireEvent.click(screen.getByRole('button', {name: 'Delete my account'}));
    await waitFor(() => expect(mocks.deleteUser).toHaveBeenCalledWith(expect.objectContaining({password: 'password'})));
    expect(mocks.push).toHaveBeenCalledWith('/sign-in');
  });
});
