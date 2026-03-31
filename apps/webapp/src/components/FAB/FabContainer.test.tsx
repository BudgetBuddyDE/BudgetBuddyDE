import {render, screen} from '@testing-library/react';
import {describe, expect, it} from 'vitest';

import {FabContainer} from './FabContainer';

describe('FabContainer', () => {
  it('renders children', () => {
    render(
      <FabContainer>
        <button type="button">Action</button>
      </FabContainer>,
    );
    // FabContainer is hidden on desktop via CSS media query (display: none at md+),
    // so we query with hidden: true or use text query
    expect(screen.getByText('Action')).toBeInTheDocument();
  });

  it('renders without crashing when no children are provided', () => {
    const {container} = render(<FabContainer />);
    expect(container).not.toBeEmptyDOMElement();
  });

  it('renders multiple children', () => {
    render(
      <FabContainer>
        <button type="button">First</button>
        <button type="button">Second</button>
      </FabContainer>,
    );
    expect(screen.getByText('First')).toBeInTheDocument();
    expect(screen.getByText('Second')).toBeInTheDocument();
  });
});
