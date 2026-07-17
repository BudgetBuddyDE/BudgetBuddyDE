import {render, screen} from '@testing-library/react';
import {describe, expect, it, vi} from 'vitest';
import {SettingsNav} from './settings-nav';

vi.mock('next/navigation', () => ({usePathname: () => '/settings/sessions'}));

describe('SettingsNav', () => {
  it('links every account area and marks the active page', () => {
    render(<SettingsNav />);
    expect(screen.getByRole('link', {name: 'Profile'})).toHaveAttribute('href', '/settings/profile');
    expect(screen.getByRole('link', {name: 'Sessions'})).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', {name: 'API keys'})).toHaveAttribute('href', '/settings/api-keys');
  });
});
