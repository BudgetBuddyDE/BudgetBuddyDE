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

  it('renders with only src — alt/width/height use parameter defaults', () => {
    const {container} = render(<Image src="/test.png" />);
    expect(container).not.toBeEmptyDOMElement();
    expect(container.querySelector('img')).toHaveAttribute('alt', '');
  });

  it('forwards data-testid', () => {
    render(<Image src="/test.png" data-testid="my-image" />);
    expect(screen.getByTestId('my-image')).toBeInTheDocument();
  });
});
