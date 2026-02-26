import {fireEvent, render, screen} from '@testing-library/react';
import {describe, expect, it, vi} from 'vitest';

import ErrorBoundary from './ErrorBoundary';

const ThrowingComponent = ({shouldThrow}: {shouldThrow: boolean}) => {
  if (shouldThrow) throw new Error('Test error');
  return <div>Normal content</div>;
};

describe('ErrorBoundary', () => {
  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={false} />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Normal content')).toBeInTheDocument();
  });

  it('renders default error UI when an error is thrown', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>,
    );
    expect(screen.getByText("Something wen't wrong")).toBeInTheDocument();
    expect(screen.getByText('Test error')).toBeInTheDocument();
    consoleError.mockRestore();
  });

  it('renders fallback node when fallback prop is provided', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <ErrorBoundary fallback={<div>Custom fallback</div>}>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Custom fallback')).toBeInTheDocument();
    consoleError.mockRestore();
  });

  it('renders FallbackComponent when provided', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const Fallback = ({error}: {error: Error; reset: () => void}) => <div>Error: {error.message}</div>;
    render(
      <ErrorBoundary FallbackComponent={Fallback}>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Error: Test error')).toBeInTheDocument();
    consoleError.mockRestore();
  });

  it('calls onError when an error is caught', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const onError = vi.fn();
    render(
      <ErrorBoundary onError={onError}>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>,
    );
    expect(onError).toHaveBeenCalledWith(expect.any(Error), expect.any(Object));
    consoleError.mockRestore();
  });

  it('resets error state when Retry button is clicked', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    let shouldThrow = true;
    const DynamicComponent = () => {
      if (shouldThrow) throw new Error('Test error');
      return <div>Normal content</div>;
    };
    render(
      <ErrorBoundary>
        <DynamicComponent />
      </ErrorBoundary>,
    );
    expect(screen.getByText("Something wen't wrong")).toBeInTheDocument();
    shouldThrow = false;
    fireEvent.click(screen.getByRole('button', {name: 'Retry'}));
    expect(screen.getByText('Normal content')).toBeInTheDocument();
    consoleError.mockRestore();
  });
});
