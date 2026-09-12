import {render, screen} from '@testing-library/react';
import {describe, expect, it} from 'vitest';

import {SlideTransition} from './SlideTransition';
import {ZoomTransition} from './ZoomTransition';

describe('SlideTransition', () => {
  it('renders children', () => {
    render(
      <SlideTransition>
        <div data-testid="slide-child">Slide content</div>
      </SlideTransition>,
    );
    expect(screen.getByTestId('slide-child')).toBeInTheDocument();
  });

  it('renders children text content', () => {
    render(
      <SlideTransition>
        <span>Slide text</span>
      </SlideTransition>,
    );
    expect(screen.getByText('Slide text')).toBeInTheDocument();
  });
});

describe('ZoomTransition', () => {
  it('renders children', () => {
    render(
      <ZoomTransition>
        <div data-testid="zoom-child">Zoom content</div>
      </ZoomTransition>,
    );
    expect(screen.getByTestId('zoom-child')).toBeInTheDocument();
  });

  it('renders children text content', () => {
    render(
      <ZoomTransition>
        <span>Zoom text</span>
      </ZoomTransition>,
    );
    expect(screen.getByText('Zoom text')).toBeInTheDocument();
  });
});
