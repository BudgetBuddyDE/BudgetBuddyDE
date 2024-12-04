import {render, screen} from '@testing-library/react';
import {BrowserRouter} from 'react-router-dom';
import {expect, test} from 'vitest';

import {AppConfig} from '@/app.config';

import {Brand} from './Brand.component';

test('Brand renders correctly without link', () => {
  render(<Brand />);

  const brandText = screen.getByText(AppConfig.appName);

  expect(brandText).toBeInTheDocument();
  expect(brandText.tagName).toBe('H5');
});

test('Brand renders correctly with link', () => {
  render(
    <BrowserRouter>
      <Brand asLink={true} />
    </BrowserRouter>,
  );

  const brandLink = screen.getByRole('link', {name: AppConfig.appName});

  expect(brandLink).toBeInTheDocument();
  expect(brandLink.tagName).toBe('A');
});
