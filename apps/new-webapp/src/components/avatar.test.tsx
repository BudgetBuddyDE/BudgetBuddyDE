import {render, screen} from '@testing-library/react';
import {describe, expect, it} from 'vitest';
import {Avatar} from './avatar';

describe('Avatar', () => {
  it('renders a rounded initial fallback with an accessible name', () => {
    render(<Avatar name="Alex Morgan" size="lg" />);

    const avatar = screen.getByRole('img', {name: 'Alex Morgan avatar'});
    expect(avatar).toHaveTextContent('A');
    expect(avatar).toHaveClass('avatar', 'avatar-lg');
  });

  it('renders the profile image when one is available', () => {
    render(<Avatar name="Alex Morgan" image="https://example.com/alex.png" />);

    expect(screen.getByRole('img', {name: 'Alex Morgan avatar'}).querySelector('img')).toHaveAttribute(
      'src',
      'https://example.com/alex.png',
    );
  });
});
