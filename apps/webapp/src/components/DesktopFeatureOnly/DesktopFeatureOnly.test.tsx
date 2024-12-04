import {render, screen} from '@testing-library/react';

import {DesktopFeatureOnly} from './DesktopFeatureOnly.component';

test('renders the component with the correct text', () => {
  render(<DesktopFeatureOnly />);

  const textElement = screen.getByText('This feature is desktop only');
  expect(textElement).toBeInTheDocument();
});
