import {render, screen} from '@testing-library/react';
import {describe, expect, it} from 'vitest';
import {BrandLogo} from './brand-logo';

describe('BrandLogo', () => {
  it('provides fixed-size light and dark wordmarks without layout shift', () => {
    render(<BrandLogo />);
    const images = screen.getAllByRole('img', {name: 'BudgetBuddy'});
    expect(images).toHaveLength(2);
    expect(images[0]).toHaveAttribute('width', '250');
    expect(images[0]).toHaveAttribute('height', '48');
    expect(images.map(image => image.getAttribute('src'))).toEqual(
      expect.arrayContaining([
        expect.stringContaining('/brand/logo-light.svg'),
        expect.stringContaining('/brand/logo-dark.svg'),
      ]),
    );
  });

  it('uses the compact scalable mark at small sizes', () => {
    render(<BrandLogo compact alt="BudgetBuddy home" />);
    const image = screen.getByRole('img', {name: 'BudgetBuddy home'});
    expect(image).toHaveAttribute('src', expect.stringContaining('/brand/mark.svg'));
    expect(image).toHaveAttribute('width', '48');
    expect(image).toHaveAttribute('height', '48');
  });
});
