import {render, screen} from '@testing-library/react';
import {describe, expect, it} from 'vitest';

import {Image} from './Image';

describe('Image', () => {
  it('renders an img element', () => {
    render(<Image src="/test.png" alt="test" />);
    expect(screen.getByRole('img')).toBeInTheDocument();
  });

  it('passes src and alt props through', () => {
    render(<Image src="/logo.png" alt="Logo" />);
    const img = screen.getByAltText('Logo');
    expect(img).toHaveAttribute('src', '/logo.png');
  });

  it('renders without crashing when no props are provided', () => {
    const {container} = render(<Image />);
    expect(container).not.toBeEmptyDOMElement();
  });

  it('forwards data-testid', () => {
    render(<Image data-testid="my-image" alt="img" />);
    expect(screen.getByTestId('my-image')).toBeInTheDocument();
  });
});
