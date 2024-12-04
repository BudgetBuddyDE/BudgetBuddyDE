import {render, screen} from '@testing-library/react';
import {describe, expect, it} from 'vitest';

import {Linkify} from './Linkify.component';

describe('That tests is "linkified" the correct way', () => {
  it('renders linkified text', () => {
    render(<Linkify>Check out this website: https://example.com</Linkify>);

    const linkElement = screen.getByText('Check out this website:');
    const anchorElement = screen.getByRole('link', {name: 'https://example.com'});

    expect(linkElement).toBeInTheDocument();
    expect(anchorElement).toBeInTheDocument();
    expect(anchorElement).toHaveAttribute('href', 'https://example.com');
    expect(anchorElement).toHaveStyle({textDecoration: 'none'});
  });

  it("will render normal text if it doesn't contain a URL", () => {
    render(<Linkify>Check out this website!</Linkify>);

    const linkElement = screen.getByText('Check out this website!');

    expect(linkElement).toBeInTheDocument();
  });
});
