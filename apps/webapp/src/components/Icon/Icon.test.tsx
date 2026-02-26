import {render, screen} from '@testing-library/react';
import {describe, expect, it} from 'vitest';

import {Icon} from './Icon';

describe('Icon', () => {
  it('renders the icon node passed to it', () => {
    render(<Icon icon={<span data-testid="test-icon">★</span>} />);
    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
  });

  it('renders without crashing when given a string icon', () => {
    const {container} = render(<Icon icon="★" />);
    expect(container).not.toBeEmptyDOMElement();
  });

  it('applies iconcolor prop without crashing', () => {
    render(<Icon icon={<span data-testid="colored-icon">●</span>} iconcolor="error" />);
    expect(screen.getByTestId('colored-icon')).toBeInTheDocument();
  });
});
