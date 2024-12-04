import {act, render, screen} from '@testing-library/react';

import {ParentSize} from './ParentSize.component';

describe('ParentSize', () => {
  it('renders children with initial size', () => {
    render(
      <ParentSize>
        {({width, height}) => (
          <div>
            Width: {width}px Height: {height}px
          </div>
        )}
      </ParentSize>,
    );

    expect(screen.getByText(/Width: 0px/)).toBeInTheDocument();
    expect(screen.getByText(/Height: 0px/)).toBeInTheDocument();
  });

  it('updates size on window resize', () => {
    const {container} = render(
      <ParentSize>
        {({width, height}) => (
          <div>
            Width: {width}px Height: {height}px
          </div>
        )}
      </ParentSize>,
    );

    // Mock the container size
    Object.defineProperty(container.firstChild, 'offsetWidth', {value: 500, configurable: true});
    Object.defineProperty(container.firstChild, 'offsetHeight', {value: 300, configurable: true});

    act(() => {
      window.dispatchEvent(new Event('resize'));
    });

    expect(screen.getByText(/Width: 500px/)).toBeInTheDocument();
    expect(screen.getByText(/Height: 300px/)).toBeInTheDocument();
  });

  it('cleans up event listener on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

    const {unmount} = render(
      <ParentSize>
        {({width, height}) => (
          <div>
            Width: {width}px Height: {height}px
          </div>
        )}
      </ParentSize>,
    );

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
  });
});
