import {render, screen} from '@testing-library/react';
import {describe, expect, it} from 'vitest';

import {FadeTransition} from './FadeTransition';
import {GrowTransition} from './GrowTransition';
import {SlideTransition} from './SlideTransition';
import {ZoomTransition} from './ZoomTransition';

describe('FadeTransition', () => {
  it('renders children', () => {
    render(
      <FadeTransition>
        <div data-testid="fade-child">Fade content</div>
      </FadeTransition>,
    );
    expect(screen.getByTestId('fade-child')).toBeInTheDocument();
  });

  it('renders children text content', () => {
    render(
      <FadeTransition>
        <span>Fade text</span>
      </FadeTransition>,
    );
    expect(screen.getByText('Fade text')).toBeInTheDocument();
  });
});

describe('GrowTransition', () => {
  it('renders children', () => {
    render(
      <GrowTransition>
        <div data-testid="grow-child">Grow content</div>
      </GrowTransition>,
    );
    expect(screen.getByTestId('grow-child')).toBeInTheDocument();
  });

  it('renders children text content', () => {
    render(
      <GrowTransition>
        <span>Grow text</span>
      </GrowTransition>,
    );
    expect(screen.getByText('Grow text')).toBeInTheDocument();
  });
});

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
