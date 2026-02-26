import {render, screen} from '@testing-library/react';
import {describe, expect, it} from 'vitest';

import {CircularProgress} from './CircularProgress';

describe('CircularProgress', () => {
  it('renders without crashing', () => {
    const {container} = render(<CircularProgress />);
    expect(container).not.toBeEmptyDOMElement();
  });

  it('renders an MUI circular progress indicator', () => {
    render(<CircularProgress />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });
});
