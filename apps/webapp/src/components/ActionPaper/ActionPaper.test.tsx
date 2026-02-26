import {render, screen} from '@testing-library/react';
import {describe, expect, it} from 'vitest';

import {ActionPaper} from './ActionPaper';

describe('ActionPaper', () => {
  it('renders children', () => {
    render(
      <ActionPaper>
        <span>Content</span>
      </ActionPaper>,
    );
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('renders without crashing when no children are provided', () => {
    const {container} = render(<ActionPaper />);
    expect(container).not.toBeEmptyDOMElement();
  });

  it('passes sx props through', () => {
    render(
      <ActionPaper data-testid="action-paper" sx={{mt: 1}}>
        <span>test</span>
      </ActionPaper>,
    );
    expect(screen.getByTestId('action-paper')).toBeInTheDocument();
  });
});
